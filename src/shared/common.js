//아이디 정규표현식

// aa_aa@aa.com 이메일 정규 표현식

export const emailCheck = (email) => {
    let _reg = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]*/;

    return _reg.test(email);
}
