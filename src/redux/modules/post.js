import {createAction, handleActions} from "redux-actions";
import {produce} from "immer";

import {firestore, storage} from "../../shared/firebase";
import "moment";
import moment from 'moment';

import {actionCreators as imageActions} from "./image";

//Action Type
const SET_POST = "SET_POST";
const ADD_POST = "ADD_POST";
const EDIT_POST = "EDIT_POST";
const DELETE_POST = "DELETE_POST";
const LOADING = "LOADING";

const LIKE_TOGGLE = "LIKE_TOGGLE";

//Action Creator
const setPost = createAction(SET_POST, (post_list, paging) => ({ post_list, paging }));
const addPost = createAction(ADD_POST, (post) => ({ post }));
const editPost = createAction(EDIT_POST, (post_id, post) => ({
    post_id,
    post,
}));
const loading = createAction(LOADING, (is_loading) => ({ is_loading }));
const deletePost = createAction(DELETE_POST, (post_id) => ({ post_id }));

const likeToggle = createAction(LIKE_TOGGLE, (post_id, is_like = null) => ({
    post_id,
    is_like,
}));

// initialState
const initialState = {
    list: [],
    paging: { start: null, next: null, size: 3 },
    is_loading: false,
};

const initialPost = {
    image_url: "https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2Fbjxjkf%2Fbtq8UaIDgTj%2FgFeb0JVazS1mKu5OKCdVk1%2Fimg.png",
    contents: "",
    comment_cnt: 0,
    like_cnt: 0,
    is_like: false,
    layout_type: "a",
    insert_dt: moment().format("YYYY-MM-DD HH:mm:ss"),
};

const editPostFB = (post_id = null, post = {}) => {
    return function (dispatch, getState, { history }) {
        if (!post_id) {
            console.log("게시물 정보가 없어요!");
            return;
        }

        const _image = getState().image.preview;

        const _post_idx = getState().post.list.findIndex((p) => p.id === post_id);
        const _post = getState().post.list[_post_idx];

        console.log(_post);

        const postDB = firestore.collection("post");

        if (_image === _post.image_url) {
            postDB
                .doc(post_id)
                .update(post)
                .then((doc) => {
                    dispatch(editPost(post_id, { ...post }));
                    dispatch(imageActions.setPreview(null));
                    history.replace("/");
                });
            return;
        } else {
            const user_id = getState().user.user.uid;
            const _upload = storage
                .ref(`images/${user_id}_${new Date().getTime()}`)
                .putString(_image, "data_url");

            _upload.then((snapshot) => {
                snapshot.ref
                    .getDownloadURL()
                    .then((url) => {
                        return url;
                    })
                    .then((url) => {
                        postDB
                            .doc(post_id)
                            .update({ ...post, image_url: url })
                            .then((doc) => {
                                dispatch(editPost(post_id, { ...post, image_url: url }));
                                dispatch(imageActions.setPreview(null));
                                history.replace("/");
                            });
                    })
                    .catch((err) => {
                        window.alert("앗! 이미지 업로드에 문제가 있어요!");
                        console.log("앗! 이미지 업로드에 문제가 있어요!", err);
                    });
            });
        }
    };
};

const addPostFB = (contents = "", layout_type = "a") => {
    return function (dispatch, getState, { history }) {
        const postDB = firestore.collection("post");
        const _user = getState().user.user;

        const user_info = {
            user_name: _user.user_name,
            user_id: _user.uid,
            user_profile: _user.user_profile,
        };

        const _post = {
            ...initialPost,
            contents: contents,
            layout_type: layout_type,
            insert_dt: moment().format("YYYY-MM-DD HH:mm:ss"),
        };

        //확인
        console.log(_post);


        const _image = getState().image.preview;

        // 데이터 타입확인
        console.log(typeof _image);

        // 파일 이름 유저 아이디와 시간으로 만들어주기
        const _upload = storage
            .ref(`images/${user_info.user_id}_${new Date().getTime()}`)
            .putString(_image, "data_url");

        _upload
            .then((snapshot) => {
                snapshot.ref
                    .getDownloadURL()
                    .then((url) => {
                        // url을 확인
                        console.log(url);
                        dispatch(imageActions.uploadImage(url));
                        return url;
                    })
                    .then((url) => {
                        postDB
                            .add({ ...user_info, ..._post, image_url: url })
                            .then((doc) => {
                                // 아이디를 추가
                                let post = { user_info, ..._post, id: doc.id, image_url: url };
                                // 리덕스에 넣기
                                dispatch(addPost(post));
                                history.replace("/");

                                dispatch(imageActions.setPreview(null));
                            })
                            .catch((err) => {
                                window.alert("앗! 포스트 작성에 문제가 있어요!");
                                console.log("post 작성에 실패했어요!", err);
                            });
                    })
                    .catch((err) => {
                        window.alert("앗! 이미지 업로드에 문제가 있어요!");
                        console.log("앗! 이미지 업로드에 문제가 있어요!", err);
                    });
            });
    };
};

const getPostFB = (start = null, size = 3) => {
    return function (dispatch, getState, { history }) {

        let _paging = getState().post.paging;

        if(_paging.start && !_paging.next){
            return;
        }

        dispatch(loading(true));
        const postDB = firestore.collection("post");

        let query = postDB.orderBy("insert_dt", "desc");

        if(start){
            query = query.startAt(start);
        }

        query
            .limit(size + 1)
            .get()
            .then((docs) => {
                let post_list = [];

                let paging = {
                    start: docs.docs[0], //스타트에 들어가는건 document안에서 제일 첫번째거를 가지고 온다는 뜻
                    next: docs.docs.length === size + 1 ? docs.docs[docs.docs.length - 1] : null,
                    size: size,
                }

                docs.forEach((doc) => {
                    let _post = doc.data()
                //파이어스토어에서 가지고온 값
                    //딕셔너리의 키값을 배열로 만들어줌
                    //['commenct_cnt', 'contents', ..]
                    let post = Object.keys(_post).reduce((acc, cur) => {

                        if (cur.indexOf("user_") !== -1) {
                            return {
                                ...acc,
                                user_info: {...acc.user_info, [cur]: _post[cur]},
                            };
                        }
                        return {...acc, [cur]: _post[cur]};
                    }, {id: doc.id, user_info: {}});//아이디만 안들어가있기때문에 기본값으로 넣어줌줌

                    post_list.push(post);

                });
                if (paging.next) {
                    post_list.pop();
                }
                if(getState().user.user){
                    dispatch(setIsLike(post_list, paging));
                }else{
                    dispatch(setPost(post_list, paging));
                }

            });
    };
};

const toggleLikeFB = (post_id) => {
    return function (dispatch, getState, { history }) {

        if (!getState().user.user) {
            return;
        }

        const postDB = firestore.collection("post");
        const likeDB = firestore.collection("like");

        // post를 찾기 위해, 배열의 몇 번째에 있나 찾아옵니다.
        const _idx = getState().post.list.findIndex((p) => p.id === post_id);

        // post 정보를 가져오고,
        const _post = getState().post.list[_idx];

        // user id도 가져와요!
        const user_id = getState().user.user.uid;

        // 좋아요한 상태라면 해제하기
        // 해제 순서
        // 1. likeDB에서 해당 데이터를 지우고,
        // 2. postDB에서 like_cnt를 -1해주기
        if (_post.is_like) {
            likeDB
                .where("post_id", "==", _post.id)
                .where("user_id", "==", user_id)
                .get()
                .then((docs) => {

                    // batch는 파이어스토어에 작업할 내용을 묶어서 한번에 하도록 도와줘요!
                    // 자세한 내용은 firestore docs를 참고해주세요 :)
                    // 저는 아래에서 like 콜렉션에 있을 좋아요 데이터를 지우고,
                    // post 콜렉션의 like_cnt를 하나 빼줬습니다!
                    let batch = firestore.batch();

                    docs.forEach((doc) => {
                        batch.delete(likeDB.doc(doc.id));
                    });

                    batch.update(postDB.doc(post_id), {
                        like_cnt:
                            _post.like_cnt - 1 < 1 ? _post.like_cnt : _post.like_cnt - 1,
                    });

                    batch.commit().then(() => {

                        // 이제 리덕스 데이터를 바꿔줘요!
                        dispatch(likeToggle(post_id, !_post.is_like));
                    });
                })
                .catch((err) => {
                    console.log(err);
                });
        } else {
            // 좋아요 해제 상태라면 좋아요 하기
            // 좋아요 순서
            // 1. likeDB에서 해당 데이터를 넣고,
            // 2. postDB에서 like_cnt를 +1해주기

            likeDB.add({ post_id: post_id, user_id: user_id }).then(doc => {
                postDB.doc(post_id).update({ like_cnt: _post.like_cnt + 1 }).then(doc => {
                    // 이제 리덕스 데이터를 바꿔줘요!
                    dispatch(likeToggle(post_id, !_post.is_like));
                });
            });

        }
    };
};

// 좋아요 리스트를 가져와서 리덕스에 넣어주는 함수
const setIsLike = (_post_list, paging) => {
    return function (dispatch, getState, { history }) {
        // 로그인하지 않았을 땐 리턴!
        if (!getState().user.is_login) {
            return;
        }



        // likeDB를 잡아주고,
        const likeDB = firestore.collection("like");

        const post_ids = _post_list.map((p) => p.id);

        let like_query = likeDB.where("post_id", "in", post_ids);

        like_query.get().then((like_docs) => {

            let like_list = {};
            like_docs.forEach((doc) => {

                if (like_list[doc.data().post_id]) {
                    like_list[doc.data().post_id] = [
                        ...like_list[doc.data().post_id],
                        doc.data().user_id,
                    ];
                } else {
                    like_list[doc.data().post_id] = [doc.data().user_id];
                }
            });

            const user_id = getState().user.user.uid;
            let post_list = _post_list.map((p) => {
                // 만약 p 게시글을 좋아요한 목록에 로그인한 사용자 id가 있다면?
                if (like_list[p.id] && like_list[p.id].indexOf(user_id) !== -1) {
                    // is_like만 true로 바꿔서 return 해줘요!
                    return { ...p, is_like: true };
                }

                return p;
            });

            dispatch(setPost(post_list, paging));
        });
    };
};



const getOnePostFB = (id) => {
    return function(dispatch, getState, {history}){
        const postDB = firestore.collection("post");
        postDB
            .doc(id)
            .get()
            .then((doc) => {
            console.log(doc);
            console.log(doc.data());

            //파이어스토어에서 가지고온 값
            let _post = doc.data();
            //딕셔너리의 키값을 배열로 만들어줌
            //['commenct_cnt', 'contents', ..]
            let post = Object.keys(_post).reduce((acc, cur) => {
                    if (cur.indexOf("user_") !== -1) {
                        return {
                            ...acc,
                            user_info: {...acc.user_info, [cur]: _post[cur]},
                        };
                    }
                    return {...acc, [cur]: _post[cur]};
                }, {id: doc.id, user_info: {}}
            );//아이디만 안들어가있기때문에 기본값으로 넣어줌줌

            dispatch(setIsLike([post]));

        });
    };
};
// 게시글 삭제하기
const deletePostFB = (id) => {
    return function (dispatch, getState, { history }) {
        // id가 없으면 return!
        if (!id) {
            window.alert("삭제할 수 없는 게시글이에요!");
            return;
        }

        const postDB = firestore.collection("post");

        // 게시글 id로 선택해서 삭제하기!
        postDB
            .doc(id)
            .delete()
            .then((res) => {
                dispatch(deletePost(id));
                history.replace("/");
            })
            .catch((err) => {
                console.log(err);
            });
    };
};

// Reducer

export default handleActions(
    {
        [SET_POST]: (state, action) =>
            produce(state, (draft) => {
            draft.list.push(...action.payload.post_list);
            //리스트에 중복값이 없어야 하므로 중복제거 acc는 누산된 값 cur은 현재값
                draft.list = draft.list.reduce((acc, cur) => {
                    if(acc.findIndex(a => a.id === cur.id) === -1){
                        return [...acc, cur];
                    }else {
                        acc[acc.findIndex((a) => a.id === cur.id)] = cur;
                        return acc;
                    }
                },[]);

                if(action.payload.paging){
                    draft.paging = action.payload.paging;
                }

            draft.is_loading = false;
        }),

        [ADD_POST]: (state, action) =>
            produce(state, (draft) => {
            draft.list.unshift(action.payload.post);
            //배열의 맨 앞에 붙어야되기 때문에 unshift씀
        }),
        [EDIT_POST]: (state, action) =>
            produce(state, (draft) => {
                let idx = draft.list.findIndex((p) => p.id === action.payload.post_id);

                draft.list[idx] = { ...draft.list[idx], ...action.payload.post };
            }),
        [LOADING]: (state, action) => produce(state, (draft) => {
            draft.is_loading = action.payload.is_loading;
        }),
        [DELETE_POST]: (state, action) =>
            produce(state, (draft) => {
                let idx = draft.list.findIndex((p) => p.id === action.payload.post_id);

                if (idx !== -1) {
                    // 배열에서 idx 위치의 요소 1개를 지웁니다.
                    draft.list.splice(idx, 1);
                }
            }),
        [LIKE_TOGGLE]: (state, action) =>
            produce(state, (draft) => {

                // 배열에서 몇 번째에 있는 지 찾은 다음, is_like를 action에서 가져온 값으로 바꾸기!
                let idx = draft.list.findIndex((p) => p.id === action.payload.post_id);

                draft.list[idx].is_like = action.payload.is_like;
            }),
    },
    initialState
);

const actionCreators = {
    setPost,
    addPost,
    editPost,
    getPostFB,
    addPostFB,
    editPostFB,
    getOnePostFB,
    deletePostFB,
    toggleLikeFB,

};

export { actionCreators };