module.exports = {
	"Address": ["User", "State", "Country"],
	"Talk": ["TalkSetting", { "model_name": "User", "model_as": "fromUser" }, { "model_name": "User", "model_as": "toUser" }, "TalkThread"]
}