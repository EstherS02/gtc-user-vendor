export async function threadConversation(userID) {
	var threads = [];
	try {
		const talkThreadUsersResponse = await model['TalkThreadUsers'].findAll({
			where: {
				user_id: userID
			},
			attributes: ['id', 'thread_id', 'user_id', 'status']
		});
		const talkThreadUsers = await JSON.parse(JSON.stringify(talkThreadUsersResponse));
		await Promise.all(talkThreadUsers.map(async (talkThreadUser) => {
			threads.push(model['TalkThreadUser'].findOne({
				where: {
					thread_id: talkThreadUser.thread_id,
					user_id: {
						$ne: userID
					}
				},
				attributes: ['id', 'thread_id', 'user_id', 'status'],
				include: [{
					model: model['User'],
					attributes: ['id', 'role', 'email', 'first_name', 'last_name', 'provider', 'user_pic_url', 'status']
				}, {
					model: model['TalkThread'],
					attributes: ['id', 'group_name', 'talk_thread_status', 'status', [sequelize.fn("COUNT", sequelize.col("TalkThread->Talks.id")), "unread_count"]],
					include: [{
						model: model['Talk'],
						where: {
							is_read: 0
						},
						attributes: [],
						required: false
					}]
				}]
			}));
		}));
		const newTalkThreadUsersResponse = await Promise.all(threads);
		const newTalkThreadUsers = await JSON.parse(JSON.stringify(newTalkThreadUsersResponse));
		return newTalkThreadUsers;
	} catch (error) {
		return error;
	}
}