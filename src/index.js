import React from 'react'
import { scrollWithAnimation, Easing } from './animate.js'

const bodyScrollEl = {}

// For ff, ie
Object.defineProperty(bodyScrollEl, 'scrollTop', { // 滚动高度
  get () {
    return document.body.scrollTop || document.documentElement.scrollTop
  },
  set (val) {
    document.body.scrollTop = val
    document.documentElement.scrollTop = val
  }
})

Object.defineProperty(bodyScrollEl, 'scrollHeight', { // 所有内容高度
  get () {
    return document.body.scrollHeight || document.documentElement.scrollHeight
  }
})

Object.defineProperty(bodyScrollEl, 'offsetHeight', { // 返回窗口的高度
  get () {
    return window.innerHeight
  }
})

const scrollSpyContext = '@@scrollSpyContext'
const scrollSpyElements = {}
const scrollSpySections = {}
const activeElement = {}
const activableElements = {}
const currentIndex = {}

const options = Object.assign({
  allowNoActive: false,
  sectionSelector: null,
  data: null,
  offset: 0,
  time: 500,
  steps: 30,
  easing: null,
  active: {
    selector: null,
    class: 'active'
  },
  link: {
    selector: 'a' // 默认a标签为可点击元素
  }
}, {})

function findElements (container, selector) { // 获取一个dom容器内的指定的子元素，如果没有指定则返回直接子元素, 即找到可点击的元素
  if (!selector) {
    return container.children
  }

  const id = scrollSpyId(container) // 'default'

  const elements = []

  for (let el of container.querySelectorAll(selector)) {
    // Filter out elements that are owned by another directive
    if (scrollSpyIdFromAncestors(el) === id) {
      elements.push(el)
    }
  }

  return elements
}

function scrollSpyId (el) { // 获取指定属性的值
  return el.getAttribute('data-scroll-spy-id') || el.getAttribute('scroll-spy-id') || 'default'
}

function scrollSpyIdDefined (el) { // 下面两个属性有值的话返回true
  return !!el.getAttribute('data-scroll-spy-id') || !!el.getAttribute('scroll-spy-id')
}

function scrollSpyIdFromAncestors (el) {
  do {
    if (scrollSpyIdDefined(el)) {
      return scrollSpyId(el)
    }
    el = el.parentElement
  } while (el)
  return 'default'
}

function initScrollSections (el, sectionSelector) {
  const id = scrollSpyId(el) // default
  const scrollSpyContextEl = el[scrollSpyContext]
  const idScrollSections = findElements(el, sectionSelector)
  scrollSpySections[id] = idScrollSections

  if (idScrollSections[0] && idScrollSections[0].offsetParent !== el) {
    scrollSpyContextEl.eventEl = window
    scrollSpyContextEl.scrollEl = bodyScrollEl
  }
}

function getOffsetTop (elem, untilParent) { // 找到相对于body的高度
  let offsetTop = 0
  do {
    if (!isNaN(elem.offsetTop)) { // 如果是数字
      offsetTop += elem.offsetTop
    }
    elem = elem.offsetParent
  } while (elem && elem !== untilParent)
  return offsetTop
}

/**
 * el: div.main
 * index: 第几个子元素
**/
function scrollTo (el, index) {
  const id = scrollSpyId(el)
  const idScrollSections = scrollSpySections[id] // HTMLCollection(3)[div, div, div]

  const {scrollEl, options} = el[scrollSpyContext]

  const current = scrollEl.scrollTop // 当前div.main的滚动距离

  if (idScrollSections[index]) {
    const target = getOffsetTop(idScrollSections[index]) - options.offset
    if (options.easing) {
      scrollWithAnimation(scrollEl, current, target, options.time, options.easing)
      return
    }

    const time = options.time
    const steps = options.steps
    const timems = parseInt(time / steps)
    const gap = target - current
    for (let i = 0; i <= steps; i++) {
      const pos = current + (gap / steps) * i
      setTimeout(() => {
        scrollEl.scrollTop = pos
      }, timems * i)
    }
  }
}

function scrollSpyActive (el, activeClassName) {
  const activeOptions = Object.assign({}, options.active, { class: activeClassName }) // { selector: null, class: customActive }
  initScrollActiveElement(el, activeOptions)
}

function initScrollActiveElement (el, activeOptions) {
  const id = scrollSpyId(el) // default
  activableElements[id] = findElements(el, activeOptions.selector) // ['li.menu-item customActive','li.menu-item','li.menu-item']
  Array.from(activableElements[id]).map(el => { // 给每个li添加一个@@scrollSpyContext属性，值为 { options: {selector: null, class: "customActive"}}
    el[scrollSpyContext] = { // 此处就是切换li的选中状态
      options: activeOptions
    }
  })
}

function scrollLinkClickHandler (index, scrollSpyId, event) {
  /* index为点击的第几个a链接，scrollSpyId：'default'  此处的scrollSpyElements是{default:div.main} */
  scrollTo(scrollSpyElements[scrollSpyId], index)
}


function initScrollLink (el, selector) {
  /* el: <ul></ul> selector:'a' */
  const id = scrollSpyId(el) // 获取 data-scroll-spy-id 或 scroll-spy-id 属性的值， 此处为：'default'

  let linkElements = findElements(el, selector) // [a, a, a]

  for (let i = 0; i < linkElements.length; i++) {
    const linkElement = linkElements[i]

    const listener = scrollLinkClickHandler.bind(null, i, id)
    if (!linkElement[scrollSpyContext]) {
      linkElement[scrollSpyContext] = {}
    }

    if (!linkElement[scrollSpyContext].click) {
      linkElement.addEventListener('click', listener)
      linkElement[scrollSpyContext].click = listener
    }
  }
}

class Spy extends React.Component {
  constructor(props) {
    super(props);
    this.el = React.createRef();
  }

  componentDidMount() {
    this.init()
  }

  componentDidUpdate() {
    const el = this.el.current
    const {onScroll, options: {sectionSelector}} = el[scrollSpyContext]

    initScrollSections(el, sectionSelector)
    onScroll()
  }

  componentWillUnmount() {
    const el = this.el.current
    const {eventEl, onScroll} = el[scrollSpyContext]
    eventEl.removeEventListener('scroll', onScroll)
  }

  onScroll = () => {
    const el = this.el.current
    const id = scrollSpyId(el) // default
    const idScrollSections = scrollSpySections[id]
    const {scrollEl, options} = el[scrollSpyContext]
    
    let index

    /* offsetHeight:div.mian自身的高度，scrollTop：div.main的滚动高度，scrollHeight：整个div.mian的高度  */
    if ((scrollEl.offsetHeight + scrollEl.scrollTop) >= scrollEl.scrollHeight - 10) {
      index = idScrollSections.length
    } else {
      for (index = 0; index < idScrollSections.length; index++) {
        if (getOffsetTop(idScrollSections[index], scrollEl) - options.offset > scrollEl.scrollTop) {
          break
        }
      }
    }

    index = index - 1

    if (index < 0) {
      index = options.allowNoActive ? null : 0
    } else if (options.allowNoActive && index >= idScrollSections.length - 1 &&
      getOffsetTop(idScrollSections[index]) + idScrollSections[index].offsetHeight < scrollEl.scrollTop) {
      index = null
    }

    if (index !== currentIndex[id]) {
      let idActiveElement = activeElement[id]
      if (idActiveElement) {
        idActiveElement.classList.remove(idActiveElement[scrollSpyContext].options.class)
        activeElement[id] = null
      }

      currentIndex[id] = index
      if (typeof currentIndex !== 'undefined' && Object.keys(activableElements).length > 0) {
        idActiveElement = activableElements[id][currentIndex[id]]
        activeElement[id] = idActiveElement

        if (idActiveElement) {
          idActiveElement.classList.add(idActiveElement[scrollSpyContext].options.class)
        }
      }
    }

  }

  init = () => {
    const el = this.el.current
    const onScroll = this.onScroll
    const id = scrollSpyId(el) // default
    el[scrollSpyContext] = {
      onScroll,
      options: Object.assign({}, options),
      id: scrollSpyId(el), // default
      eventEl: el,
      scrollEl: el
    }
    scrollSpyElements[id] = el
    delete currentIndex[id]

    const {options: {sectionSelector}} = el[scrollSpyContext]
    initScrollSections(el, sectionSelector) // el:  div.main sectionSelector: null
    const {eventEl} = el[scrollSpyContext]
    eventEl.addEventListener('scroll', onScroll)
    onScroll()
  }

  render() { 
    return (
      <div>
        {[this.props.children].map((el, index) => {
          return <el.type {...el.props} ref={this.el} key={index}>{el.props.children}</el.type>
        })}
      </div>
    );
  }
}

class SpyLink extends React.Component {
  constructor(props) {
    super(props);
    this.el = React.createRef();
    this.UlEl = React.createRef();
  }

  componentDidMount() {
    this.init()
    const { activeClass } = this.props
    scrollSpyActive(this.UlEl.current, activeClass)
  }

  componentDidUpdate() {
    const el = this.el.current
    const linkOptions = Object.assign({}, options.link)
    initScrollLink(el, linkOptions.selector)
  }

  componentWillUnmount() {
    const el = this.el.current
    const linkElements = findElements(el)

    for (let i = 0; i < linkElements.length; i++) {
      const linkElement = linkElements[i]
      const id = scrollSpyId(el)
      const listener = scrollLinkClickHandler.bind(null, i, id)
      if (!linkElement[scrollSpyContext]) {
        linkElement[scrollSpyContext] = {}
      }

      if (linkElement[scrollSpyContext].click) {
        linkElement.removeEventListener('click', listener)
        delete linkElement[scrollSpyContext]['click']
      }
    }
  }

  init = () => {
    const el = this.el.current
    const linkOptions = Object.assign({}, options.link) // { selector: 'a'}
    initScrollLink(el, linkOptions.selector) // el: <ul class='menu'></ul>
  }

  render() { 
    return (
      <div>
        {[this.props.children].map((el, index) => {
          return <el.type {...el.props} ref={this.el} key={index}>
          {[el.props.children].map((e, index) => {
            return <e.type {...e.props} ref={this.UlEl} key={index}>{e.props.children}</e.type>
          })
          }</el.type>
        })}
      </div>
    );
  }
}
 
export default { Spy, SpyLink }
