import GlobalUnit from './unit/global'
import BindUnit from './unit/bind'
import Logger from '../logger'

GlobalUnit((sonar)=>{
    Logger('Bind Unit Actived..')
    BindUnit(sonar, sonar._active)

    // TODO Bind는 최초 한번만 랜덤문자열로 실행 후
    // 5초 내로 받는데 성공하면 통과처리
    // 실패 시엔 시스템 폴트 처리

    // 그 이후는 모든 시스템 플러그인에 의해 작동

    // on 리스너 달 수 있도록 이벤트리스너 구현
    // TODO cancelable 서브모듈 구현

    //
})