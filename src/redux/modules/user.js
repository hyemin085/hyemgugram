import {createAction, handleActions} from "redux-actions"
import {produce} from "immer";
import firebase from "firebase/app";

import {setCookie, getCookie, deleteCookie} from "../../shared/Cookie"
//action type을 정의
import {auth} from "../../shared/firebase";

//actions
const LOG_OUT = "LOG_OUT";
const GET_USER = "GET_USER";
const SET_USER = "SET_USER";

//action creator
//createAction하면 우선 type넘기고 그다음에 파라미터를 넘겨주면 끝\
const logOut = createAction(LOG_OUT, (user) => ({user}));
const getUser = createAction(GET_USER, (user) => ({user}));
const setUser = createAction(SET_USER, (user) =>({user}));


//initialState
const initialState = {
    user: null,
    is_login: false,
};
const user_initial = {
    user_name: 'hyem',
}

//middleware actions (로그인하게)
const loginFB = (id, pwd) => {
    return function (dispatch, getState, { history }) {
        auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).then((res) => {
            auth
                .signInWithEmailAndPassword(id, pwd)
                .then((user) => {
                    console.log(user);

                    dispatch(
                        setUser({
                            user_name: user.user.displayName,
                            id: id,
                            user_profile: "",
                            uid: user.user.uid,
                        })
                    );

                    history.push("/");
                })
                .catch((error) => {
                    var errorCode = error.code;
                    var errorMessage = error.message;

                    console.log(errorCode, errorMessage);
                });
        });
    };
};

const signupFB = (id, pwd, user_name) => {
    return function (dispatch, getState, {history}){
        auth
            .createUserWithEmailAndPassword(id, pwd)
            .then((user) => {

                console.log(user);

                auth.currentUser.updateProfile({
                    displayName: user_name,
                }).then(()=> {
                    //성공하면 then으로 들어온다
                    dispatch(setUser({user_name: user_name, id: id, user_profile: ''}));
                    history.pust('/');
                }).catch((error) => {
                    console.log(error);
                });

                auth.currentUser.updateProfile({
                    displayName: user_name,
                }).then(()=>{
                    dispatch(setUser({user_name: user_name, id: id, user_profile: ''}));
                    history.push('/');
                }).catch((error) => {
                    console.log(error);
                });

                // Signed in
                // ...
            })
            .catch((error) => {
                var errorCode = error.code;
                var errorMessage = error.message;

                console.log(errorCode, errorMessage);
                // ..
            });

    }
}
//onAuthStateChanged 유저가 있냐 없냐
const loginCheckFB =() => {
    return function (dispatch, getState, {history}) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                dispatch(
                    setUser({
                        user_name: user.displayName,
                        user_profile: "",
                        id: user.email,
                        uid: user.uid,
                    })
                );
            } else {
                dispatch(logOut());
            }
        })
    }
}

const logoutFB = () => {
    return function (dispatch, getState, {history}) {
        auth.signOut().then(() => {
            dispatch(logOut());
            history.replace('/');
            //replace는 지금있는페이지와 괄호안에 있는페이지로 바꿔치지 하는 것.
            })
    }
}



// reducer (리듀서 안에서 일어나는 작업의 불변성 유지를 해줄꺼기 때문에 immer사용함)

export default handleActions({
        [SET_USER]: (state, action) => produce(state, (draft) => {
            setCookie("is_login", "success");//원래 토큰들어가야함
            draft.user = action.payload.user; //draft쓰면 불변성유지하고 가져옴
            draft.is_login = true;
        }),
        [LOG_OUT]: (state, action) => produce(state, (draft) => {
            deleteCookie("is_login");
            draft.user = null;
            draft.is_login = false;

        }),
        [GET_USER]: (state, action) => produce(state, (draft) => {
        }),
    },
    initialState
);

// action creator export
const actionCreators = {
    getUser,
    logOut,
    signupFB,
    loginFB,
    loginCheckFB,
    logoutFB,
};

export { actionCreators };
//기본강의에서 한 방식
// const login = (user) => {
//     return {
//         type: LOG_IN,
//         user: GET_USER,
//     }
// }

// const reducer = () => {
//     switch(action.type){
//         case "LOG_IN" : {
//             state.user = action.user;
//         }
//     }
// }


