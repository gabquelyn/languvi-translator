function token(length){
    let code = "";
    for(let i = 0; i <= length; i++){
        const char = Math.floor((Math.random() * 9))
        code += char
    }
    return code
} 
export default token