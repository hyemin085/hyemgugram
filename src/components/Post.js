import React from "react";
import { Grid, Image, Text, Button } from "../elements";
import HeartButton from "./HeartButton";

import { history } from "../redux/configureStore";

import { useDispatch } from "react-redux";
import { actionCreators as postActions } from "../redux/modules/post";


const Post = React.memo((props) => {

  const dispatch = useDispatch();

  return (
      <React.Fragment>
        <Grid>
          <Grid is_flex padding="16px">
            <Grid is_flex width="auto">
              <Image shape="circle" src={props.src} />
              <Text bold>{props.user_info.user_name}</Text>
            </Grid>
            <Grid is_flex width="auto">
              <Text>{props.insert_dt}</Text>
              {props.is_me && (
                  <React.Fragment>
                    <Button
                        width="auto"
                        margin="4px"
                        padding="4px"
                        _onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          history.push(`/write/${props.id}`);
                        }}
                    >
                      수정
                    </Button>
                    <Button
                        width="auto"
                        margin="4px"
                        padding="4px"
                        _onClick={(e) => {
                          //  이벤트 캡쳐링과 버블링을 막아요!
                          // 이벤트 캡쳐링, 버블링이 뭔지 검색해보기! :)
                          e.preventDefault();
                          e.stopPropagation();

                          // 게시글 삭제하기
                          // 여기에서는 window.confirm 등을 사용해서 진짜 지우냐고 한 번 더 물어봐주면 정말 좋겠죠!
                          dispatch(postActions.deletePostFB(props.id));
                        }}
                    >
                      삭제
                    </Button>
                  </React.Fragment>
              )}
            </Grid>
          </Grid>

          {/* layout type이 a일 때 */}
          {props.layout_type === "a" && (
              <React.Fragment>
                <Grid padding="16px">
                  <Text>{props.contents}</Text>
                </Grid>
                <Grid>
                  <Image shape="rectangle" src={props.image_url} />
                </Grid>
              </React.Fragment>
          )}

          {/* layout type이 b일 때 */}
          {props.layout_type === "b" && (
              <React.Fragment>
                <Grid is_flex>
                  <Grid width="50%" padding="16px">
                    <Text>{props.contents}</Text>
                  </Grid>
                  <Image shape="rectangle" src={props.image_url} />
                </Grid>
              </React.Fragment>
          )}

          {/* layout type이 c일 때 */}
          {props.layout_type === "c" && (
              <React.Fragment>
                <Grid is_flex>
                  <Image shape="rectangle" src={props.image_url} />
                  <Grid width="50%" padding="16px">
                    <Text>{props.contents}</Text>
                  </Grid>
                </Grid>
              </React.Fragment>
          )}

          <Grid is_flex padding="4px 10px">
            <Text margin="0px" bold>
              댓글 {props.comment_cnt}개 /
              좋아요 {props.is_like? props.like_cnt+1 : props.like_cnt}개
            </Text>

            <HeartButton
                _onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dispatch(postActions.toggleLikeFB(props.id));
                }}
                is_like={props.is_like}

            ></HeartButton>
          </Grid>
        </Grid>
      </React.Fragment>
  );
});

Post.defaultProps = {
  id: null,
  user_info: {
    user_id: "",
    user_name: "",
    user_profile: "",
  },
  image_url: "",
  contents: "",
  like_cnt: 0,
  comment_cnt : 0,
  layout_type: "a",
  insert_dt: "2021-02-27 10:00:00",
  is_like: false,
  is_me: false,
};

export default Post;
