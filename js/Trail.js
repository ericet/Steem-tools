

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

function getAuthorizedList(accounts) {
    return new Promise((resolve, reject) => {
        let authorizedList = [];
        steem.api.getAccounts(accounts, function (err, result) {
            if (!err) {
                for (let account of result) {
                    let account_auths = account.posting.account_auths;
                    for (let app of account_auths) {
                        if (app[0] === 'cn-trail') {
                            authorizedList.push(account);
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
    let trailMembers = await getAuthorizedList(followers);
    trailMembers = trailMembers.reverse();
    console.log(trailMembers);
    let htmlString = '<table id="dvlist" class="display" style="width:100%"><tr><th>No.</th><th>Steem ID</th></tr>';
    for(let i in trailMembers){
        htmlString += '<tr>';
        htmlString += `<td>${Number(i)+1}</td>`
		htmlString += `<td><span>${trailMembers[i].name}</span></td>`;
		htmlString += '</tr>';
    }
    htmlString += `</table>`;
    $('div#display').html(htmlString);
});