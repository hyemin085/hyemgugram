import React from "react";
import _ from "lodash";
import {Spinner} from "../elements"

const InfinityScroll = (props) => {

    const{children, callNext, is_next, loading} = props;

    const _handleScroll = _.throttle(() => {
        if(loading){ //로딩이 되고있는 중에는 callNext를 불러오고 싶지 않을때 리턴값줌
            return;
        }
        const {innerHeight} = window;
        const {scrollHeight} = document.body;

        //doc안에 doc이 있니? 있으면은 scrollTop가지고 와라 저렇게 못가져오면 도큐먼트의 바디의 탑을 가지고와라
        const scrollTop = (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop

        if(scrollHeight - innerHeight - scrollTop < 200){
            callNext();
        }
    }, 300);

    const handleScroll = React.useCallback(_handleScroll, [loading]);

    React.useEffect(() => {
        if(loading){
            return;
        }
        if(is_next){
            window.addEventListener("scroll", handleScroll);
        }else{
            window.removeEventListener("scroll", handleScroll);
        }
        return () => window.removeEventListener("scroll", () => {});
    }, [is_next, loading]);

    return(
        <React.Fragment>
            {props.children}
            {is_next && <Spinner/>}
            {/*이렇게 해야 화면에 나옴*/}

        </React.Fragment>
    )
}

InfinityScroll.defaultProps = {
    children: null,
    callNext: () => {},
    is_next: false,
    loading: false,
}

export default InfinityScroll