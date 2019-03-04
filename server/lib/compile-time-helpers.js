const config = require('../config/environment');

export function imageUrl(element) {

		let n = element.startsWith(`/image`);
		let returnValue = element;
		if(n){
			returnValue= config.baseUrl+element;		
		}else{
			returnValue=element;	
		}
		return returnValue;
}