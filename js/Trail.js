steem.api.setOptions({ url: "https://api.steemitdev.com" });

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

function getAuthorizedList(accounts, spv) {
    return new Promise((resolve, reject) => {
        let authorizedList = [];
        steem.api.getAccounts(accounts, function (err, result) {
            if (!err) {
                for (let account of result) {
                    let account_auths = account.posting.account_auths;
                    for (let app of account_auths) {
                        if (app[0] === 'cn-trail') {
                            let sp = (Number(account.received_vesting_shares.split(' ')[0]) - Number(account.delegated_vesting_shares.split(' ')[0]) + Number(account.vesting_shares.split(' ')[0])) * spv;
                            let vp = getVPHF20(account);
                            authorizedList.push({ name: account.name, sp: sp.toFixed(3), vp: vp.toFixed(2) });
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

function getVp(account) {
    return new Promise((resolve, reject) => {
        steem.api.getAccounts([account], function (err, result) {
            if (err) {
                reject(err);
            } else {
                if (result != undefined) {
                    let vp = getVPHF20(result[0]);
                    resolve(vp);
                } else {
                    utils.log(err);
                    reject(err);
                }
            }
        });
    });

}

function getVPHF20(account) {
    var totalShares = parseFloat(account.vesting_shares) + parseFloat(account.received_vesting_shares) - parseFloat(account.delegated_vesting_shares) - parseFloat(account.vesting_withdraw_rate);

    var elapsed = Date.now() / 1000 - account.voting_manabar.last_update_time;
    var maxMana = totalShares * 1000000;
    // 432000 sec = 5 days
    var currentMana = parseFloat(account.voting_manabar.current_mana) + elapsed * maxMana / 432000;

    if (currentMana > maxMana) {
        currentMana = maxMana;
    }

    var currentManaPerc = currentMana * 100 / maxMana;

    return Math.round(currentManaPerc * 100);
}

function getVoteList() {
    return new Promise((resolve, reject) => {
        const url = 'https://trail.steem.buzz/getList';
        let upvoteList = [];
        axios.get(url).then(function (response) {
            if (response.status == 200) {
                let data = response.data;
                for (let d of data) {
                    upvoteList.push({ account: d.account, sp: d.sp, hasVoted: d.hasVoted })
                }
                resolve(upvoteList);

            }

        });

    });
}

function getVoteListTable(voteList) {
    let htmlString = `<table class="table" id="votelist" style="width:100%"> <thead class="thead-light">
    <tr>
    <th ><i class="fas fa-user-circle"></i></th>
    <th >Steem ID</th>
    <th >Steem Power</th>
    <th >Voted</th>
  </tr>
</thead><tbody>`;
    for (let vote of voteList) {
        let imageUrl = `https://steemitimages.com/u/${vote.account}/avatar/small`;
        htmlString += '<tr>';
        htmlString += `<td><img src="${imageUrl}" class="rounded-circle"></span></td>`;
        htmlString += `<td><span>${vote.account}</span></td>`;
        htmlString += `<td><span>${vote.sp}</span></td>`;
        htmlString += `<td><span>${vote.hasVoted}</span></td>`;
        htmlString += '</tr>';
    }
    htmlString += `</tbody></table>`;
    $('div#voteList').html(htmlString);
}


$(document).ready(async function () {

    const [followers, spv, accountVp, voteList] = await Promise.all([getFollowersList('cn-trail'), getSpv(), getVp('cn-trail'), getVoteList()]);
    console.log(voteList)
    let trailMembers = await getAuthorizedList(followers, spv);
    let totalSp = 0;
    trailMembers = trailMembers.reverse();
    getVoteListTable(voteList);
    let htmlString = `<table class="table" id="dvlist" style="width:100%"> <thead class="thead-light">
    <tr>
      <th >#</th>
      <th ><i class="fas fa-user-circle"></i></th>
      <th >Steem ID</th>
      <th >Steem Power</th>
      <th >Voting Power</th>
    </tr>
  </thead><tbody>`;
    for (let i in trailMembers) {
        let imageUrl = `https://steemitimages.com/u/${trailMembers[i].name}/avatar/small`;
        htmlString += '<tr>';
        htmlString += `<td><h2>${Number(i) + 1}</h2></td>`
        htmlString += `<td><img src="${imageUrl}" class="rounded-circle"></span></td>`;
        htmlString += `<td><span>${trailMembers[i].name}</span></td>`;
        htmlString += `<td><span>${trailMembers[i].sp}</span></td>`;
        htmlString += `<td><span>${trailMembers[i].vp / 100}%</span></td>`;
        htmlString += '</tr>';
        totalSp += Number(trailMembers[i].sp);
    }
    htmlString += `</tbody></table>`;
    $('div#display').html(htmlString);
    $('#dvlist').DataTable({
        "pageLength": 100
    });
    $('#votelist').DataTable({
        "pageLength": 100

    });
    let summary = `<table class="table table-borderless">
    <thead>
      <tr>
        <th scope="col">Total SP</th>
        <th scope="col">Total Members</th>
        <th scope="col">@cn-trail VP</th>
      </tr>
    </thead>
    <tbody>
    <tr>
    <td>${totalSp.toFixed(3)}</td>
    <td>${trailMembers.length}</td>
    <td>${accountVp / 100}%</td>
  </tr></tbody></table>`;
    $('div#summary').html(summary);

    let x = document.getElementById("pleaseWait");
    x.style.display = "none";



});
