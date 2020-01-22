
async function display(account, totalSp, esteemUpvote, busyUpvote) {
	return new Promise(async function (resolve, reject) {
		let htmlString = '';
		htmlString += '<tr>';
		htmlString += '<td><span class="names">Steem ID</span></td>';
		htmlString += `<td>${account}</td>`;
		htmlString += '</tr>';
		htmlString += '<tr>';
		htmlString += '<tr>';
		htmlString += '<td><span class="names">Followers Total Effective SP</span></td>';
		htmlString += `<td>${totalSp.toFixed(2)} SP</td>`;
		htmlString += '</tr>';
		htmlString += '<tr>';
		htmlString += '<td><span class="names">Busy.pay Upvote Percentage</span></td>';
		htmlString += `<td>${busyUpvote.toFixed(2)}%</td>`;
		htmlString += '</tr>';

		htmlString += '<tr>';
		htmlString += '<td><span class="names">Esteem Upvote Percentage</span></td>';
		htmlString += `<td>${esteemUpvote.toFixed(2)}%</td>`;
		htmlString += '</tr>';
		
		 htmlString += '<tr>';
        htmlString += '<td></td>';
        htmlString += `<td></td>`;
        htmlString += '</tr>';

		resolve(htmlString);
	});

}

function getFollowersSP(account, spv, start = 0, limit = 1000, followers = [], totalSp = 0) {
	return new Promise((resolve, reject) => {
		steem.api.getFollowers(account, start, 'blog', limit, async function (err, result) {
			if (result.length > 1) {
				let newResult = [];
				result.forEach(follower => {
					if (follower.follower != start) {
						newResult.push(follower);
					}
				});
				followers = [...followers, ...newResult];
				let followersList = [];
				for (let i in newResult) {
					followersList.push(newResult[i].follower);
				}
				let sp = await getAccounts(followersList, spv);
				totalSp += sp;
				getFollowersSP(account, spv, result[result.length - 1].follower, limit, followers, totalSp)
				.then(resolve)
				.catch(reject);
			} else {
				resolve(totalSp);
			}
		});
	});
}

function getAccounts(account, spv) {
	return new Promise((resolve, reject) => {
		steem.api.getAccounts(account, async function (err, result) {
			let totalSp = 0;
			for (let res of result) {
				totalSp += res.vesting_shares.replace(" VESTS", "") * spv;

			}
			resolve(totalSp);

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

$(document).ready(async function () {

	$('#view').submit(async function (e) {
		e.preventDefault();
		$('#log').val('');
		let htmlString = '<table id="dvlist" class="display" style="width:100%">';
		const input = $('#username').val();
		let usernames = input.split(',');
		let spv = await getSpv();
		for (let username of usernames) {
			let totalSp = 0;
			let esteemUpvote = 0;
			let busyUpvote = 0;
			totalSp = await getFollowersSP(username, spv);
			
			if (totalSp >= 400000) {
				esteemUpvote = 6;
			} else {
				esteemUpvote = totalSp / 400000 * 6;
			}
			if (totalSp >= 500000) {
				busyUpvote = totalSp / 1000000;
			}
			let string = await display(username, totalSp, esteemUpvote, busyUpvote);
			htmlString += string;
		}
		htmlString += `</table>`;
		$('div#display').html(htmlString);
		//let account = await getAccount('ericet');


	});
});
