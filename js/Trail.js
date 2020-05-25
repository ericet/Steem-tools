steem.api.setOptions({url:"https://api.steemdb.online});

//get followers list
function getFollowersList(account, startFollowing = '', limit = 500, followings = {}) {
    return new Promise((resolve, reject) => {
        let followings = [];
        steem.api.getFollowers(account, startFollowing, 'blog', limit, function (err, result) {
            if (result.length > 1) {
                for (let res of result) {
                    followings.push(res.follower);
                }
            }
            resolve(followings);

        });
    });

}

function getSpv() {
    return new Promise((resolve, reject) => {
        steem.api.getDynamicGlobalProperties(function (err, result) {
            spv = result.total_vesting_fund_steem.replace(" STEEM", "") / result.total_vesting_shares.replace(" VESTS", "");
            resolve(spv);
        });
    });
}

function getAuthorizedList(accounts,spv) {
    return new Promise((resolve, reject) => {
        let authorizedList = [];
        steem.api.getAccounts(accounts, function (err, result) {
            if (!err) {
                for (let account of result) {
                    let account_auths = account.posting.account_auths;
                    for (let app of account_auths) {
                        if (app[0] === 'cn-trail') {
                            let sp = (Number(account.received_vesting_shares.split(' ')[0]) - Number(account.delegated_vesting_shares.split(' ')[0]) + Number(account.vesting_shares.split(' ')[0])) * spv;
                            authorizedList.push({name:account.name,sp:sp.toFixed(3)});
                        }
                    }
                }
                resolve(authorizedList);
            } else {
                reject(err);
            }
        });
    });
}



$(document).ready(async function () {
    let followers = await getFollowersList('cn-trail');
    let spv = await getSpv();
    let trailMembers = await getAuthorizedList(followers,spv);
    trailMembers = trailMembers.reverse();
    let htmlString = '<table id="dvlist" class="display" style="width:100%"><tr><th>No.</th><th>Steem ID</th><th>SP</th></tr>';
    for(let i in trailMembers){
        htmlString += '<tr>';
        htmlString += `<td>${Number(i)+1}</td>`
        htmlString += `<td><span>${trailMembers[i].name}</span></td>`;
        htmlString += `<td><span>${trailMembers[i].sp}</span></td>`;

		htmlString += '</tr>';
    }
    htmlString += `</table>`;
    $('div#display').html(htmlString);
    sorttable.makeSortable(document.getElementById("dvlist"));
});
