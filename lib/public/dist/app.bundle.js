import"./chunks/chunk-72ZECFVW.js";var Tr,Se,qf,Pr,hs,Uf,Jf,Zf,Yf,qc,zc,Uc,Xf,oa={},ra=[],Ck=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,Rr=Array.isArray;function _n(t,e){for(var n in e)t[n]=e[n];return t}function Jc(t){t&&t.parentNode&&t.parentNode.removeChild(t)}function T(t,e,n){var s,o,r,i={};for(r in e)r=="key"?s=e[r]:r=="ref"?o=e[r]:i[r]=e[r];if(arguments.length>2&&(i.children=arguments.length>3?Tr.call(arguments,2):n),typeof t=="function"&&t.defaultProps!=null)for(r in t.defaultProps)i[r]===void 0&&(i[r]=t.defaultProps[r]);return Ar(t,i,s,o,null)}function Ar(t,e,n,s,o){var r={type:t,props:e,key:n,ref:s,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:o??++qf,__i:-1,__u:0};return o==null&&Se.vnode!=null&&Se.vnode(r),r}function ln(t){return t.children}function hn(t,e){this.props=t,this.context=e}function $o(t,e){if(e==null)return t.__?$o(t.__,t.__i+1):null;for(var n;e<t.__k.length;e++)if((n=t.__k[e])!=null&&n.__e!=null)return n.__e;return typeof t.type=="function"?$o(t):null}function _k(t){if(t.__P&&t.__d){var e=t.__v,n=e.__e,s=[],o=[],r=_n({},e);r.__v=e.__v+1,Se.vnode&&Se.vnode(r),Zc(t.__P,r,e,t.__n,t.__P.namespaceURI,32&e.__u?[n]:null,s,n??$o(e),!!(32&e.__u),o),r.__v=e.__v,r.__.__k[r.__i]=r,nh(s,r,o),e.__e=e.__=null,r.__e!=n&&Qf(r)}}function Qf(t){if((t=t.__)!=null&&t.__c!=null)return t.__e=t.__c.base=null,t.__k.some(function(e){if(e!=null&&e.__e!=null)return t.__e=t.__c.base=e.__e}),Qf(t)}function Kc(t){(!t.__d&&(t.__d=!0)&&hs.push(t)&&!ia.__r++||Uf!=Se.debounceRendering)&&((Uf=Se.debounceRendering)||Jf)(ia)}function ia(){try{for(var t,e=1;hs.length;)hs.length>e&&hs.sort(Zf),t=hs.shift(),e=hs.length,_k(t)}finally{hs.length=ia.__r=0}}function eh(t,e,n,s,o,r,i,a,l,c,d){var u,p,f,g,m,h,b,x=s&&s.__k||ra,v=e.length;for(l=Mk(n,e,x,l,v),u=0;u<v;u++)(f=n.__k[u])!=null&&(p=f.__i!=-1&&x[f.__i]||oa,f.__i=u,h=Zc(t,f,p,o,r,i,a,l,c,d),g=f.__e,f.ref&&p.ref!=f.ref&&(p.ref&&Yc(p.ref,null,f),d.push(f.ref,f.__c||g,f)),m==null&&g!=null&&(m=g),(b=!!(4&f.__u))||p.__k===f.__k?l=th(f,l,t,b):typeof f.type=="function"&&h!==void 0?l=h:g&&(l=g.nextSibling),f.__u&=-7);return n.__e=m,l}function Mk(t,e,n,s,o){var r,i,a,l,c,d=n.length,u=d,p=0;for(t.__k=new Array(o),r=0;r<o;r++)(i=e[r])!=null&&typeof i!="boolean"&&typeof i!="function"?(typeof i=="string"||typeof i=="number"||typeof i=="bigint"||i.constructor==String?i=t.__k[r]=Ar(null,i,null,null,null):Rr(i)?i=t.__k[r]=Ar(ln,{children:i},null,null,null):i.constructor===void 0&&i.__b>0?i=t.__k[r]=Ar(i.type,i.props,i.key,i.ref?i.ref:null,i.__v):t.__k[r]=i,l=r+p,i.__=t,i.__b=t.__b+1,a=null,(c=i.__i=Ak(i,n,l,u))!=-1&&(u--,(a=n[c])&&(a.__u|=2)),a==null||a.__v==null?(c==-1&&(o>d?p--:o<d&&p++),typeof i.type!="function"&&(i.__u|=4)):c!=l&&(c==l-1?p--:c==l+1?p++:(c>l?p--:p++,i.__u|=4))):t.__k[r]=null;if(u)for(r=0;r<d;r++)(a=n[r])!=null&&(2&a.__u)==0&&(a.__e==s&&(s=$o(a)),oh(a,a));return s}function th(t,e,n,s){var o,r;if(typeof t.type=="function"){for(o=t.__k,r=0;o&&r<o.length;r++)o[r]&&(o[r].__=t,e=th(o[r],e,n,s));return e}t.__e!=e&&(s&&(e&&t.type&&!e.parentNode&&(e=$o(t)),n.insertBefore(t.__e,e||null)),e=t.__e);do e=e&&e.nextSibling;while(e!=null&&e.nodeType==8);return e}function Lr(t,e){return e=e||[],t==null||typeof t=="boolean"||(Rr(t)?t.some(function(n){Lr(n,e)}):e.push(t)),e}function Ak(t,e,n,s){var o,r,i,a=t.key,l=t.type,c=e[n],d=c!=null&&(2&c.__u)==0;if(c===null&&a==null||d&&a==c.key&&l==c.type)return n;if(s>(d?1:0)){for(o=n-1,r=n+1;o>=0||r<e.length;)if((c=e[i=o>=0?o--:r++])!=null&&(2&c.__u)==0&&a==c.key&&l==c.type)return i}return-1}function Kf(t,e,n){e[0]=="-"?t.setProperty(e,n??""):t[e]=n==null?"":typeof n!="number"||Ck.test(e)?n:n+"px"}function sa(t,e,n,s,o){var r,i;e:if(e=="style")if(typeof n=="string")t.style.cssText=n;else{if(typeof s=="string"&&(t.style.cssText=s=""),s)for(e in s)n&&e in n||Kf(t.style,e,"");if(n)for(e in n)s&&n[e]==s[e]||Kf(t.style,e,n[e])}else if(e[0]=="o"&&e[1]=="n")r=e!=(e=e.replace(Yf,"$1")),i=e.toLowerCase(),e=i in t||e=="onFocusOut"||e=="onFocusIn"?i.slice(2):e.slice(2),t.l||(t.l={}),t.l[e+r]=n,n?s?n.u=s.u:(n.u=qc,t.addEventListener(e,r?Uc:zc,r)):t.removeEventListener(e,r?Uc:zc,r);else{if(o=="http://www.w3.org/2000/svg")e=e.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(e!="width"&&e!="height"&&e!="href"&&e!="list"&&e!="form"&&e!="tabIndex"&&e!="download"&&e!="rowSpan"&&e!="colSpan"&&e!="role"&&e!="popover"&&e in t)try{t[e]=n??"";break e}catch{}typeof n=="function"||(n==null||n===!1&&e[4]!="-"?t.removeAttribute(e):t.setAttribute(e,e=="popover"&&n==1?"":n))}}function Gf(t){return function(e){if(this.l){var n=this.l[e.type+t];if(e.t==null)e.t=qc++;else if(e.t<n.u)return;return n(Se.event?Se.event(e):e)}}}function Zc(t,e,n,s,o,r,i,a,l,c){var d,u,p,f,g,m,h,b,x,v,w,$,S,C,_,k=e.type;if(e.constructor!==void 0)return null;128&n.__u&&(l=!!(32&n.__u),r=[a=e.__e=n.__e]),(d=Se.__b)&&d(e);e:if(typeof k=="function")try{if(b=e.props,x=k.prototype&&k.prototype.render,v=(d=k.contextType)&&s[d.__c],w=d?v?v.props.value:d.__:s,n.__c?h=(u=e.__c=n.__c).__=u.__E:(x?e.__c=u=new k(b,w):(e.__c=u=new hn(b,w),u.constructor=k,u.render=Pk),v&&v.sub(u),u.state||(u.state={}),u.__n=s,p=u.__d=!0,u.__h=[],u._sb=[]),x&&u.__s==null&&(u.__s=u.state),x&&k.getDerivedStateFromProps!=null&&(u.__s==u.state&&(u.__s=_n({},u.__s)),_n(u.__s,k.getDerivedStateFromProps(b,u.__s))),f=u.props,g=u.state,u.__v=e,p)x&&k.getDerivedStateFromProps==null&&u.componentWillMount!=null&&u.componentWillMount(),x&&u.componentDidMount!=null&&u.__h.push(u.componentDidMount);else{if(x&&k.getDerivedStateFromProps==null&&b!==f&&u.componentWillReceiveProps!=null&&u.componentWillReceiveProps(b,w),e.__v==n.__v||!u.__e&&u.shouldComponentUpdate!=null&&u.shouldComponentUpdate(b,u.__s,w)===!1){e.__v!=n.__v&&(u.props=b,u.state=u.__s,u.__d=!1),e.__e=n.__e,e.__k=n.__k,e.__k.some(function(A){A&&(A.__=e)}),ra.push.apply(u.__h,u._sb),u._sb=[],u.__h.length&&i.push(u);break e}u.componentWillUpdate!=null&&u.componentWillUpdate(b,u.__s,w),x&&u.componentDidUpdate!=null&&u.__h.push(function(){u.componentDidUpdate(f,g,m)})}if(u.context=w,u.props=b,u.__P=t,u.__e=!1,$=Se.__r,S=0,x)u.state=u.__s,u.__d=!1,$&&$(e),d=u.render(u.props,u.state,u.context),ra.push.apply(u.__h,u._sb),u._sb=[];else do u.__d=!1,$&&$(e),d=u.render(u.props,u.state,u.context),u.state=u.__s;while(u.__d&&++S<25);u.state=u.__s,u.getChildContext!=null&&(s=_n(_n({},s),u.getChildContext())),x&&!p&&u.getSnapshotBeforeUpdate!=null&&(m=u.getSnapshotBeforeUpdate(f,g)),C=d!=null&&d.type===ln&&d.key==null?sh(d.props.children):d,a=eh(t,Rr(C)?C:[C],e,n,s,o,r,i,a,l,c),u.base=e.__e,e.__u&=-161,u.__h.length&&i.push(u),h&&(u.__E=u.__=null)}catch(A){if(e.__v=null,l||r!=null)if(A.then){for(e.__u|=l?160:128;a&&a.nodeType==8&&a.nextSibling;)a=a.nextSibling;r[r.indexOf(a)]=null,e.__e=a}else{for(_=r.length;_--;)Jc(r[_]);Gc(e)}else e.__e=n.__e,e.__k=n.__k,A.then||Gc(e);Se.__e(A,e,n)}else r==null&&e.__v==n.__v?(e.__k=n.__k,e.__e=n.__e):a=e.__e=Tk(n.__e,e,n,s,o,r,i,l,c);return(d=Se.diffed)&&d(e),128&e.__u?void 0:a}function Gc(t){t&&(t.__c&&(t.__c.__e=!0),t.__k&&t.__k.some(Gc))}function nh(t,e,n){for(var s=0;s<n.length;s++)Yc(n[s],n[++s],n[++s]);Se.__c&&Se.__c(e,t),t.some(function(o){try{t=o.__h,o.__h=[],t.some(function(r){r.call(o)})}catch(r){Se.__e(r,o.__v)}})}function sh(t){return typeof t!="object"||t==null||t.__b>0?t:Rr(t)?t.map(sh):_n({},t)}function Tk(t,e,n,s,o,r,i,a,l){var c,d,u,p,f,g,m,h=n.props||oa,b=e.props,x=e.type;if(x=="svg"?o="http://www.w3.org/2000/svg":x=="math"?o="http://www.w3.org/1998/Math/MathML":o||(o="http://www.w3.org/1999/xhtml"),r!=null){for(c=0;c<r.length;c++)if((f=r[c])&&"setAttribute"in f==!!x&&(x?f.localName==x:f.nodeType==3)){t=f,r[c]=null;break}}if(t==null){if(x==null)return document.createTextNode(b);t=document.createElementNS(o,x,b.is&&b),a&&(Se.__m&&Se.__m(e,r),a=!1),r=null}if(x==null)h===b||a&&t.data==b||(t.data=b);else{if(r=r&&Tr.call(t.childNodes),!a&&r!=null)for(h={},c=0;c<t.attributes.length;c++)h[(f=t.attributes[c]).name]=f.value;for(c in h)f=h[c],c=="dangerouslySetInnerHTML"?u=f:c=="children"||c in b||c=="value"&&"defaultValue"in b||c=="checked"&&"defaultChecked"in b||sa(t,c,null,f,o);for(c in b)f=b[c],c=="children"?p=f:c=="dangerouslySetInnerHTML"?d=f:c=="value"?g=f:c=="checked"?m=f:a&&typeof f!="function"||h[c]===f||sa(t,c,f,h[c],o);if(d)a||u&&(d.__html==u.__html||d.__html==t.innerHTML)||(t.innerHTML=d.__html),e.__k=[];else if(u&&(t.innerHTML=""),eh(e.type=="template"?t.content:t,Rr(p)?p:[p],e,n,s,x=="foreignObject"?"http://www.w3.org/1999/xhtml":o,r,i,r?r[0]:n.__k&&$o(n,0),a,l),r!=null)for(c=r.length;c--;)Jc(r[c]);a||(c="value",x=="progress"&&g==null?t.removeAttribute("value"):g!=null&&(g!==t[c]||x=="progress"&&!g||x=="option"&&g!=h[c])&&sa(t,c,g,h[c],o),c="checked",m!=null&&m!=t[c]&&sa(t,c,m,h[c],o))}return t}function Yc(t,e,n){try{if(typeof t=="function"){var s=typeof t.__u=="function";s&&t.__u(),s&&e==null||(t.__u=t(e))}else t.current=e}catch(o){Se.__e(o,n)}}function oh(t,e,n){var s,o;if(Se.unmount&&Se.unmount(t),(s=t.ref)&&(s.current&&s.current!=t.__e||Yc(s,null,e)),(s=t.__c)!=null){if(s.componentWillUnmount)try{s.componentWillUnmount()}catch(r){Se.__e(r,e)}s.base=s.__P=null}if(s=t.__k)for(o=0;o<s.length;o++)s[o]&&oh(s[o],e,n||typeof t.type!="function");n||Jc(t.__e),t.__c=t.__=t.__e=void 0}function Pk(t,e,n){return this.constructor(t,n)}function wo(t,e,n){var s,o,r,i;e==document&&(e=document.documentElement),Se.__&&Se.__(t,e),o=(s=typeof n=="function")?null:n&&n.__k||e.__k,r=[],i=[],Zc(e,t=(!s&&n||e).__k=T(ln,null,[t]),o||oa,oa,e.namespaceURI,!s&&n?[n]:o?null:e.firstChild?Tr.call(e.childNodes):null,r,!s&&n?n:o?o.__e:e.firstChild,s,i),nh(r,t,i)}function Er(t,e,n){var s,o,r,i,a=_n({},t.props);for(r in t.type&&t.type.defaultProps&&(i=t.type.defaultProps),e)r=="key"?s=e[r]:r=="ref"?o=e[r]:a[r]=e[r]===void 0&&i!=null?i[r]:e[r];return arguments.length>2&&(a.children=arguments.length>3?Tr.call(arguments,2):n),Ar(t.type,a,s||t.key,o||t.ref,null)}function ko(t){function e(n){var s,o;return this.getChildContext||(s=new Set,(o={})[e.__c]=this,this.getChildContext=function(){return o},this.componentWillUnmount=function(){s=null},this.shouldComponentUpdate=function(r){this.props.value!=r.value&&s.forEach(function(i){i.__e=!0,Kc(i)})},this.sub=function(r){s.add(r);var i=r.componentWillUnmount;r.componentWillUnmount=function(){s&&s.delete(r),i&&i.call(r)}}),n.children}return e.__c="__cC"+Xf++,e.__=t,e.Provider=e.__l=(e.Consumer=function(n,s){return n.children(s)}).contextType=e,e}Tr=ra.slice,Se={__e:function(t,e,n,s){for(var o,r,i;e=e.__;)if((o=e.__c)&&!o.__)try{if((r=o.constructor)&&r.getDerivedStateFromError!=null&&(o.setState(r.getDerivedStateFromError(t)),i=o.__d),o.componentDidCatch!=null&&(o.componentDidCatch(t,s||{}),i=o.__d),i)return o.__E=o}catch(a){t=a}throw t}},qf=0,Pr=function(t){return t!=null&&t.constructor===void 0},hn.prototype.setState=function(t,e){var n;n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=_n({},this.state),typeof t=="function"&&(t=t(_n({},n),this.props)),t&&_n(n,t),t!=null&&this.__v&&(e&&this._sb.push(e),Kc(this))},hn.prototype.forceUpdate=function(t){this.__v&&(this.__e=!0,t&&this.__h.push(t),Kc(this))},hn.prototype.render=ln,hs=[],Jf=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,Zf=function(t,e){return t.__v.__b-e.__v.__b},ia.__r=0,Yf=/(PointerCapture)$|Capture$/i,qc=0,zc=Gf(!1),Uc=Gf(!0),Xf=0;var Ws,tt,Xc,rh,Ir=0,fh=[],ut=Se,ih=ut.__b,ah=ut.__r,lh=ut.diffed,ch=ut.__c,dh=ut.unmount,uh=ut.__;function Dr(t,e){ut.__h&&ut.__h(tt,t,Ir||e),Ir=0;var n=tt.__H||(tt.__H={__:[],__h:[]});return t>=n.__.length&&n.__.push({}),n.__[t]}function y(t){return Ir=1,hh(mh,t)}function hh(t,e,n){var s=Dr(Ws++,2);if(s.t=t,!s.__c&&(s.__=[n?n(e):mh(void 0,e),function(a){var l=s.__N?s.__N[0]:s.__[0],c=s.t(l,a);l!==c&&(s.__N=[c,s.__[1]],s.__c.setState({}))}],s.__c=tt,!tt.__f)){var o=function(a,l,c){if(!s.__c.__H)return!0;var d=s.__c.__H.__.filter(function(p){return p.__c});if(d.every(function(p){return!p.__N}))return!r||r.call(this,a,l,c);var u=s.__c.props!==a;return d.some(function(p){if(p.__N){var f=p.__[0];p.__=p.__N,p.__N=void 0,f!==p.__[0]&&(u=!0)}}),r&&r.call(this,a,l,c)||u};tt.__f=!0;var r=tt.shouldComponentUpdate,i=tt.componentWillUpdate;tt.componentWillUpdate=function(a,l,c){if(this.__e){var d=r;r=void 0,o(a,l,c),r=d}i&&i.call(this,a,l,c)},tt.shouldComponentUpdate=o}return s.__N||s.__}function L(t,e){var n=Dr(Ws++,3);!ut.__s&&ed(n.__H,e)&&(n.__=t,n.u=e,tt.__H.__h.push(n))}function Vs(t,e){var n=Dr(Ws++,4);!ut.__s&&ed(n.__H,e)&&(n.__=t,n.u=e,tt.__h.push(n))}function ee(t){return Ir=5,F(function(){return{current:t}},[])}function F(t,e){var n=Dr(Ws++,7);return ed(n.__H,e)&&(n.__=t(),n.__H=e,n.__h=t),n.__}function q(t,e){return Ir=8,F(function(){return t},e)}function Nr(t){var e=tt.context[t.__c],n=Dr(Ws++,9);return n.c=t,e?(n.__==null&&(n.__=!0,e.sub(tt)),e.props.value):t.__}function Rk(){for(var t;t=fh.shift();){var e=t.__H;if(t.__P&&e)try{e.__h.some(aa),e.__h.some(Qc),e.__h=[]}catch(n){e.__h=[],ut.__e(n,t.__v)}}}ut.__b=function(t){tt=null,ih&&ih(t)},ut.__=function(t,e){t&&e.__k&&e.__k.__m&&(t.__m=e.__k.__m),uh&&uh(t,e)},ut.__r=function(t){ah&&ah(t),Ws=0;var e=(tt=t.__c).__H;e&&(Xc===tt?(e.__h=[],tt.__h=[],e.__.some(function(n){n.__N&&(n.__=n.__N),n.u=n.__N=void 0})):(e.__h.some(aa),e.__h.some(Qc),e.__h=[],Ws=0)),Xc=tt},ut.diffed=function(t){lh&&lh(t);var e=t.__c;e&&e.__H&&(e.__H.__h.length&&(fh.push(e)!==1&&rh===ut.requestAnimationFrame||((rh=ut.requestAnimationFrame)||Lk)(Rk)),e.__H.__.some(function(n){n.u&&(n.__H=n.u),n.u=void 0})),Xc=tt=null},ut.__c=function(t,e){e.some(function(n){try{n.__h.some(aa),n.__h=n.__h.filter(function(s){return!s.__||Qc(s)})}catch(s){e.some(function(o){o.__h&&(o.__h=[])}),e=[],ut.__e(s,n.__v)}}),ch&&ch(t,e)},ut.unmount=function(t){dh&&dh(t);var e,n=t.__c;n&&n.__H&&(n.__H.__.some(function(s){try{aa(s)}catch(o){e=o}}),n.__H=void 0,e&&ut.__e(e,n.__v))};var ph=typeof requestAnimationFrame=="function";function Lk(t){var e,n=function(){clearTimeout(s),ph&&cancelAnimationFrame(e),setTimeout(t)},s=setTimeout(n,35);ph&&(e=requestAnimationFrame(n))}function aa(t){var e=tt,n=t.__c;typeof n=="function"&&(t.__c=void 0,n()),tt=e}function Qc(t){var e=tt;t.__c=t.__(),tt=e}function ed(t,e){return!t||t.length!==e.length||e.some(function(n,s){return n!==t[s]})}function mh(t,e){return typeof e=="function"?e(t):e}var bh=function(t,e,n,s){var o;e[0]=0;for(var r=1;r<e.length;r++){var i=e[r++],a=e[r]?(e[0]|=i?1:2,n[e[r++]]):e[++r];i===3?s[0]=a:i===4?s[1]=Object.assign(s[1]||{},a):i===5?(s[1]=s[1]||{})[e[++r]]=a:i===6?s[1][e[++r]]+=a+"":i?(o=t.apply(a,bh(t,a,n,["",null])),s.push(o),a[0]?e[0]|=2:(e[r-2]=0,e[r]=o)):s.push(a)}return s},gh=new Map;function P(t){var e=gh.get(this);return e||(e=new Map,gh.set(this,e)),(e=bh(this,e.get(t)||(e.set(t,e=(function(n){for(var s,o,r=1,i="",a="",l=[0],c=function(p){r===1&&(p||(i=i.replace(/^\s*\n\s*|\s*\n\s*$/g,"")))?l.push(0,p,i):r===3&&(p||i)?(l.push(3,p,i),r=2):r===2&&i==="..."&&p?l.push(4,p,0):r===2&&i&&!p?l.push(5,0,!0,i):r>=5&&((i||!p&&r===5)&&(l.push(r,0,i,o),r=6),p&&(l.push(r,p,0,o),r=6)),i=""},d=0;d<n.length;d++){d&&(r===1&&c(),c(d));for(var u=0;u<n[d].length;u++)s=n[d][u],r===1?s==="<"?(c(),l=[l],r=3):i+=s:r===4?i==="--"&&s===">"?(r=1,i=""):i=s+i[0]:a?s===a?a="":i+=s:s==='"'||s==="'"?a=s:s===">"?(c(),r=1):r&&(s==="="?(r=5,o=i,i=""):s==="/"&&(r<5||n[d][u+1]===">")?(c(),r===3&&(l=l[0]),r=l,(l=l[0]).push(2,0,r),r=0):s===" "||s==="	"||s===`
`||s==="\r"?(c(),r=2):i+=s),r===3&&i==="!--"&&(r=4,l=l[0])}return c(),l})(t)),e),arguments,[])).length>1?e:e[0]}function xh(t,e){if(t instanceof RegExp)return{keys:!1,pattern:t};var n,s,o,r,i=[],a="",l=t.split("/");for(l[0]||l.shift();o=l.shift();)n=o[0],n==="*"?(i.push(n),a+=o[1]==="?"?"(?:/(.*))?":"/(.*)"):n===":"?(s=o.indexOf("?",1),r=o.indexOf(".",1),i.push(o.substring(1,~s?s:~r?r:o.length)),a+=~s&&!~r?"(?:/([^/]+?))?":"/([^/]+?)",~r&&(a+=(~s?"?":"")+"\\"+o.substring(r))):a+="/"+o;return{keys:i,pattern:new RegExp("^"+a+(e?"(?=$|/)":"/?$"),"i")}}var Ek=typeof window<"u"&&typeof window.document<"u"&&typeof window.document.createElement<"u";function td(t,e){return t===e&&(t!==0||1/t===1/e)||t!==t&&e!==e}function yh(t,e,n){n&&!Ek&&(e=n);let s=e(),[{_instance:o},r]=y({_instance:{_value:s,_getSnapshot:e}});return Vs(()=>{o._value=s,o._getSnapshot=e,td(o._value,e())||r({_instance:o})},[t,s,e]),L(()=>(td(o._value,o._getSnapshot())||r({_instance:o}),t(()=>{td(o._value,o._getSnapshot())||r({_instance:o})})),[t]),s}var nd=t=>{let e=ee([t,(...n)=>e[0](...n)]).current;return Vs(()=>{e[0]=t}),e[1]};var Ik="popstate",sd="pushState",od="replaceState",Dk="hashchange",vh=[Ik,sd,od,Dk],Nk=t=>{for(let e of vh)addEventListener(e,t);return()=>{for(let e of vh)removeEventListener(e,t)}},Sh=(t,e)=>yh(Nk,t,e),$h=()=>location.search,Ch=({ssrSearch:t}={})=>Sh($h,t!=null?()=>t:$h),wh=()=>location.pathname,Ok=({ssrPath:t}={})=>Sh(wh,t!=null?()=>t:wh);var Bk=(t,{replace:e=!1,state:n=null}={})=>history[e?od:sd](n,"",t),_h=(t={})=>[Ok(t),Bk],kh=Symbol.for("wouter_v3");if(typeof history<"u"&&typeof window[kh]>"u"){for(let t of[sd,od]){let e=history[t];history[t]=function(){let n=e.apply(this,arguments),s=new Event(t);return s.arguments=arguments,dispatchEvent(s),n}}Object.defineProperty(window,kh,{value:!0})}var Fk=(t,e)=>e.toLowerCase().indexOf(t.toLowerCase())?"~"+e:e.slice(t.length)||"/",Ah=(t="")=>t==="/"?"":t,Th=(t,e)=>t[0]==="~"?t.slice(1):Ah(e)+t,Ph=(t="",e)=>Fk(Mh(Ah(t)),Mh(e));var Mh=t=>{try{return decodeURI(t)}catch{return t}};var Lh={hook:_h,searchHook:Ch,parser:xh,base:"",ssrPath:void 0,ssrSearch:void 0,ssrContext:void 0,hrefs:t=>t,aroundNav:(t,e,n)=>t(e,n)},Eh=ko(Lh),Or=()=>Nr(Eh),Ih={},Dh=ko(Ih),Hk=()=>Nr(Dh),la=t=>{let[e,n]=t.hook(t);return[Ph(t.base,e),nd((s,o)=>t.aroundNav(n,Th(s,t.base),o))]},ca=()=>la(Or());var Nh=(t,e,n,s)=>{let{pattern:o,keys:r}=e instanceof RegExp?{keys:!1,pattern:e}:t(e||"*",s),i=o.exec(n)||[],[a,...l]=i;return a!==void 0?[!0,(()=>{let c=r!==!1?Object.fromEntries(r.map((u,p)=>[u,l[p]])):i.groups,d={...l};return c&&Object.assign(d,c),d})(),...s?[a]:[]]:[!1,null]};var da=({children:t,...e})=>{let n=Or(),s=e.hook?Lh:n,o=s,[r,i=e.ssrSearch??""]=e.ssrPath?.split("?")??[];r&&(e.ssrSearch=i,e.ssrPath=r),e.hrefs=e.hrefs??e.hook?.hrefs,e.searchHook=e.searchHook??e.hook?.searchHook;let a=ee({}),l=a.current,c=l;for(let d in s){let u=d==="base"?s[d]+(e[d]??""):e[d]??s[d];l===c&&u!==c[d]&&(a.current=c={...c}),c[d]=u,(u!==s[d]||u!==o[d])&&(o=c)}return T(Eh.Provider,{value:o,children:t})},Rh=({children:t,component:e},n)=>e?T(e,{params:n}):typeof t=="function"?t(n):t,Wk=t=>{let e=ee(Ih),n=e.current;return e.current=Object.keys(t).length!==Object.keys(n).length||Object.entries(t).some(([s,o])=>o!==n[s])?t:n};var rt=({path:t,nest:e,match:n,...s})=>{let o=Or(),[r]=la(o),[i,a,l]=n??Nh(o.parser,t,r,e),c=Wk({...Hk(),...a});if(!i)return null;let d=l?T(da,{base:l},Rh(s,c)):Rh(s,c);return T(Dh.Provider,{value:c,children:d})},l4=(t,e)=>{let n=Or(),[s,o]=la(n),{to:r="",href:i=r,onClick:a,asChild:l,children:c,className:d,replace:u,state:p,transition:f,...g}=t,m=nd(b=>{b.ctrlKey||b.metaKey||b.altKey||b.shiftKey||b.button!==0||(a?.(b),b.defaultPrevented||(b.preventDefault(),o(i,t)))}),h=n.hrefs(i[0]==="~"?i.slice(1):n.base+i,n);return l&&Pr(c)?Er(c,{onClick:m,href:h}):T("a",{...g,onClick:m,href:h,className:d?.call?d(s===i):d,children:c,ref:e})},Oh=t=>Array.isArray(t)?t.flatMap(e=>Oh(e&&e.type===ln?e.props.children:e)):[t],rd=({children:t,location:e})=>{let n=Or(),[s]=la(n);for(let o of Oh(t)){let r=0;if(Pr(o)&&(r=Nh(n.parser,o.props.path,e||s,o.props.nest))[0])return Er(o,{match:r})}return null};var id=t=>{if(typeof t!="string"||!t.trim())return{};try{return JSON.parse(t)}catch{return{}}},Bh=({url:t="",onMessage:e=()=>{},onError:n=()=>{}})=>{if(typeof window?.EventSource!="function")throw new Error("Server events are not supported in this browser");let s=new window.EventSource(String(t||""),{withCredentials:!0}),o=l=>{e({event:"phase",data:id(l?.data||"")})},r=l=>{e({event:"done",data:id(l?.data||"")})},i=l=>{e({event:"error",data:id(l?.data||"")})},a=l=>{n(l)};return s.addEventListener("phase",o),s.addEventListener("done",r),s.addEventListener("error",i),s.onerror=a,()=>{s.removeEventListener("phase",o),s.removeEventListener("done",r),s.removeEventListener("error",i),s.onerror=null,s.close()}};var Fh="x-client-timezone",Vk=()=>{try{return Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone||""}catch{return""}},Y=async(t,e={})=>{let n={...e},s=new Headers(e?.headers||{});if(!s.has(Fh)){let r=Vk();r&&s.set(Fh,r)}n.headers=s;let o=await fetch(t,n);if(o.status===401){try{window.localStorage?.clear?.()}catch{}throw window.location.href="/setup",new Error("Unauthorized")}return o},Hh=({onMessage:t=()=>{},onOpen:e=()=>{},onError:n=()=>{}}={})=>{if(typeof window?.EventSource!="function")throw new Error("Server events are not supported in this browser");let s=new window.EventSource("/api/events/status",{withCredentials:!0}),o=r=>{let i={};try{i=r?.data?JSON.parse(r.data):{}}catch{}t(i||{})};return s.addEventListener("status",o),s.onopen=()=>e(),s.onerror=r=>n(r),()=>{s.removeEventListener("status",o),s.onopen=null,s.onerror=null,s.close()}};async function So(){return(await Y("/api/status")).json()}async function Co(){return(await Y("/api/pairings")).json()}async function _o(t,e,n=""){return(await Y(`/api/pairings/${t}/approve`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({channel:e,accountId:n})})).json()}async function Mo(t,e,n=""){let s=await Y(`/api/pairings/${t}/reject`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({channel:e,accountId:n})});return fe(s,"Could not reject pairing")}async function Wh(){return(await Y("/api/google/accounts")).json()}async function Vh({accountId:t="",client:e=""}={}){let n=new URLSearchParams;t&&n.set("accountId",String(t)),e&&n.set("client",String(e));let s=n.toString()?`?${n.toString()}`:"";return(await Y(`/api/google/credentials${s}`)).json()}async function jh(t=""){let e=new URLSearchParams;t&&e.set("accountId",String(t));let n=e.toString()?`?${e.toString()}`:"";return(await Y(`/api/google/check${n}`)).json()}async function zh({clientId:t,clientSecret:e,email:n,services:s=[],client:o="default",personal:r=!1,accountId:i=""}){return(await Y("/api/google/credentials",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientId:t,clientSecret:e,email:n,services:s,client:o,personal:r,accountId:i})})).json()}async function Uh({email:t,services:e=[],client:n="default",personal:s=!1,accountId:o=""}){return(await Y("/api/google/accounts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:t,services:e,client:n,personal:s,accountId:o})})).json()}async function Kh(t=""){return(await Y("/api/google/disconnect",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({accountId:t})})).json()}var Gh=async()=>{let t=await Y("/api/gmail/config");return fe(t,"Could not load Gmail watch config")},qh=async({client:t="default",topicPath:e="",projectId:n="",regeneratePushToken:s=!1}={})=>{let o=await Y("/api/gmail/config",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({client:t,topicPath:e,projectId:n,regeneratePushToken:s})});return fe(o,"Could not save Gmail watch config")},Jh=async(t,{destination:e=null}={})=>{let n=await Y("/api/gmail/watch/start",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({accountId:String(t||""),...e?{destination:e}:{}})});return fe(n,"Could not start Gmail watch")},Zh=async t=>{let e=await Y("/api/gmail/watch/stop",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({accountId:String(t||"")})});return fe(e,"Could not stop Gmail watch")},Yh=async({accountId:t="",force:e=!0}={})=>{let n=await Y("/api/gmail/watch/renew",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({accountId:String(t||""),force:!!e})});return fe(n,"Could not renew Gmail watch")},Xh=async()=>{let t=await Y("/api/agent/sessions");return fe(t,"Could not load agent sessions")},ua=async()=>{let t=await Y("/api/doctor/status");return fe(t,"Could not load Doctor status")},Qh=async()=>{let t=await Y("/api/doctor/run",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({})});return fe(t,"Could not start Doctor run")};var em=async(t=10)=>{let e=new URLSearchParams({limit:String(t)}),n=await Y(`/api/doctor/runs?${e.toString()}`);return fe(n,"Could not load Doctor runs")},tm=async({runId:t="all"}={})=>{let e=new URLSearchParams;String(t||"").trim()&&e.set("runId",String(t||""));let n=e.toString()?`?${e.toString()}`:"",s=await Y(`/api/doctor/cards${n}`);return fe(s,"Could not load Doctor findings")};var pa=async({cardId:t,status:e})=>{let n=await Y(`/api/doctor/cards/${encodeURIComponent(String(t||""))}/status`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:String(e||"")})});return fe(n,"Could not update Doctor card status")},nm=async({cardId:t,sessionId:e="",replyChannel:n="",replyTo:s="",prompt:o=""}={})=>{let r=await Y(`/api/doctor/findings/${encodeURIComponent(String(t||""))}/fix`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:String(e||""),replyChannel:String(n||""),replyTo:String(s||""),prompt:String(o||"")})});return fe(r,"Could not send Doctor fix request")},fa=async({message:t="",sessionKey:e=""}={})=>{let n=await Y("/api/agent/message",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:String(t||""),sessionKey:String(e||"")})});return fe(n,"Could not send message to agent")};async function sm(){let t=await Y("/api/gateway/restart",{method:"POST"});return fe(t,"Could not restart gateway")}async function om(){let t=await Y("/api/restart-status");return fe(t,"Could not load restart status")}async function rm(){let t=await Y("/api/restart-status/dismiss",{method:"POST"});return fe(t,"Could not dismiss restart status")}async function im(){let t=await Y("/api/watchdog/status");return fe(t,"Could not load watchdog status")}async function am(t=30){let e=new URLSearchParams({days:String(t)}),n=await Y(`/api/usage/summary?${e.toString()}`);return fe(n,"Could not load usage summary")}async function lm(t=50){let e=new URLSearchParams({limit:String(t)}),n=await Y(`/api/usage/sessions?${e.toString()}`);return fe(n,"Could not load usage sessions")}async function cm(t){let e=await Y(`/api/usage/sessions/${encodeURIComponent(String(t||""))}`);return fe(e,"Could not load usage session detail")}async function dm(t=20){let e=await Y(`/api/watchdog/events?limit=${encodeURIComponent(String(t))}`);return fe(e,"Could not load watchdog events")}async function um(t=65536){let e=await Y(`/api/watchdog/logs?tail=${encodeURIComponent(String(t))}`);if(!e.ok)throw new Error("Could not load watchdog logs");return e.text()}async function ad(t){let e=await Y("/api/watchdog/terminal/close",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:String(t||"")})});return fe(e,"Could not close watchdog terminal")}async function ha(){let t=await Y("/api/watchdog/repair",{method:"POST"});return fe(t,"Could not trigger watchdog repair")}async function pm(){let t=await Y("/api/watchdog/resources");return fe(t,"Could not load system resources")}async function fm(){let t=await Y("/api/watchdog/settings");return fe(t,"Could not load watchdog settings")}async function ld(t){let e=await Y("/api/watchdog/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(t||{})});return fe(e,"Could not update watchdog settings")}async function hm(){return(await Y("/api/gateway/dashboard")).json()}async function mm(t=!1){return(await Y(`/api/openclaw/version${t?"?refresh=1":""}`)).json()}async function ma(){return(await Y("/api/openclaw/update",{method:"POST"})).json()}async function gm(t=!1){return(await Y(`/api/alphaclaw/version${t?"?refresh=1":""}`)).json()}async function bm(t=""){let e=String(t||"").trim(),n=e?`?${new URLSearchParams({tag:e}).toString()}`:"";try{let s=await Y(`/api/alphaclaw/release-notes${n}`);return await fe(s,"Could not load release notes")}catch{let s=e?`https://api.github.com/repos/chrysb/alphaclaw/releases/tags/${encodeURIComponent(e)}`:"https://api.github.com/repos/chrysb/alphaclaw/releases/latest",o=await fetch(s,{headers:{Accept:"application/vnd.github+json"}}),r=await o.text(),i=null;try{i=r?JSON.parse(r):null}catch{throw new Error(r||"Could not load release notes")}if(!o.ok)throw new Error(i?.message||r||"Could not load release notes");return{ok:!0,tag:String(i?.tag_name||e||""),name:String(i?.name||""),body:String(i?.body||""),htmlUrl:String(i?.html_url||""),publishedAt:String(i?.published_at||"")}}}async function xm(){return(await Y("/api/alphaclaw/update",{method:"POST"})).json()}async function ym(t){let e=await Y("/api/sync-cron",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),n=await e.text(),s;try{s=n?JSON.parse(n):{}}catch{throw new Error(n||"Could not parse sync cron response")}if(!e.ok)throw new Error(s.error||n||`HTTP ${e.status}`);return s}async function vm({sortBy:t="nextRunAtMs",sortDir:e="asc"}={}){let n=new URLSearchParams;t&&n.set("sortBy",String(t)),e&&n.set("sortDir",String(e));let s=n.toString()?`?${n.toString()}`:"",o=await Y(`/api/cron/jobs${s}`);return fe(o,"Could not load cron jobs")}async function $m(){let t=await Y("/api/cron/status");return fe(t,"Could not load cron status")}async function cd(t,{limit:e=20,offset:n=0,status:s="all",deliveryStatus:o="all",sortDir:r="desc",query:i=""}={}){let a=new URLSearchParams({limit:String(e),offset:String(n),status:String(s||"all"),deliveryStatus:String(o||"all"),sortDir:String(r||"desc")});String(i||"").trim()&&a.set("query",String(i).trim());let l=encodeURIComponent(String(t||"")),c=await Y(`/api/cron/jobs/${l}/runs?${a.toString()}`);return fe(c,"Could not load cron run history")}async function wm(t,{days:e=30}={}){let n=new URLSearchParams({days:String(e)}),s=encodeURIComponent(String(t||"")),o=await Y(`/api/cron/jobs/${s}/usage?${n.toString()}`);return fe(o,"Could not load cron job usage")}async function km(t,{range:e="7d"}={}){let n=new URLSearchParams({range:String(e||"7d")}),s=encodeURIComponent(String(t||"")),o=await Y(`/api/cron/jobs/${s}/trends?${n.toString()}`);return fe(o,"Could not load cron job trends")}async function Sm({days:t=30}={}){let e=new URLSearchParams({days:String(t)}),n=await Y(`/api/cron/usage/bulk?${e.toString()}`);return fe(n,"Could not load cron usage overview")}async function Cm({sinceMs:t=0,limitPerJob:e=20,status:n="all",deliveryStatus:s="all",sortDir:o="desc"}={}){let r=new URLSearchParams({sinceMs:String(t||0),limitPerJob:String(e||20),status:String(n||"all"),deliveryStatus:String(s||"all"),sortDir:String(o||"desc")}),i=await Y(`/api/cron/runs/bulk?${r.toString()}`);return fe(i,"Could not load cron run outcomes")}async function _m(t){let e=encodeURIComponent(String(t||"")),n=await Y(`/api/cron/jobs/${e}/run`,{method:"POST"});return fe(n,"Could not trigger cron job run")}async function Mm(t,e){let n=encodeURIComponent(String(t||"")),o=await Y(`/api/cron/jobs/${n}/${e?"enable":"disable"}`,{method:"POST"});return fe(o,"Could not update cron job state")}async function Am(t,e){let n=encodeURIComponent(String(t||"")),s=await Y(`/api/cron/jobs/${n}/prompt`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:String(e||"")})});return fe(s,"Could not update cron prompt")}async function Tm(t,{sessionTarget:e="",wakeMode:n="",deliveryMode:s="",deliveryChannel:o="",deliveryTo:r=""}={}){let i=encodeURIComponent(String(t||"")),a=await Y(`/api/cron/jobs/${i}/routing`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionTarget:String(e||""),wakeMode:String(n||""),deliveryMode:String(s||""),deliveryChannel:String(o||""),deliveryTo:String(r||"")})});return fe(a,"Could not update cron routing")}async function ga(){return(await Y("/api/devices")).json()}async function ba(t){return(await Y(`/api/devices/${t}/approve`,{method:"POST"})).json()}async function xa(t){return(await Y(`/api/devices/${t}/reject`,{method:"POST"})).json()}var Pm=async()=>{let t=await Y("/api/nodes");return fe(t,"Could not load nodes")};var Rm=async t=>{let e=encodeURIComponent(String(t||"")),n=await Y(`/api/nodes/${e}`,{method:"DELETE"});return fe(n,"Could not remove node")},Lm=async t=>{let e=encodeURIComponent(String(t||"")),n=new AbortController,s=setTimeout(()=>n.abort(),2e4);try{let o=await Y(`/api/nodes/${e}/route`,{method:"POST",signal:n.signal});return fe(o,"Could not route execution to node")}catch(o){throw String(o?.name||"")==="AbortError"?new Error("Routing timed out. Gateway may be restarting or unavailable."):o}finally{clearTimeout(s)}},ya=async()=>{let t=await Y("/api/nodes/connect-info");return fe(t,"Could not load connect info")},Em=async(t,e="user")=>{let n=encodeURIComponent(String(t||"")),s=new URLSearchParams({profile:String(e||"user")}),o=await Y(`/api/nodes/${n}/browser-status?${s.toString()}`);return fe(o,"Could not load node browser status")};var Im=async()=>(await Y("/api/auth/status")).json(),Dm=async()=>(await Y("/api/auth/logout",{method:"POST"})).json();async function Nm(){return(await Y("/api/onboard/status")).json()}async function Om(t,e,{importMode:n=!1}={}){return(await Y("/api/onboard",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({vars:t,modelKey:e,importMode:n})})).json()}async function va(t,e,n="new"){return(await Y("/api/onboard/github/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({repo:t,token:e,mode:n})})).json()}async function Bm(t){return(await Y("/api/onboard/import/scan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tempDir:t})})).json()}async function Fm({tempDir:t,approvedSecrets:e=[],skipSecretExtraction:n=!1,githubRepo:s="",githubToken:o=""}){return(await Y("/api/onboard/import/apply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tempDir:t,approvedSecrets:e,skipSecretExtraction:n,githubRepo:s,githubToken:o})})).json()}var Br=async()=>(await Y("/api/models")).json();var Hm=async({agentId:t}={})=>{let e=t?`?agentId=${encodeURIComponent(t)}`:"";return(await Y(`/api/models/config${e}`)).json()},Wm=async({primary:t,configuredModels:e,profiles:n,authOrder:s,agentId:o}={})=>{let r=o?`?agentId=${encodeURIComponent(o)}`:"";return(await Y(`/api/models/config${r}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({primary:t,configuredModels:e,profiles:n,authOrder:s})})).json()};var Ao=async()=>{let t=await Y("/api/agents");return fe(t,"Could not load agents")},To=async()=>{let t=await Y("/api/channels/accounts");return fe(t,"Could not load channel accounts")},Vm=async({provider:t="",accountId:e="default"}={})=>{let n=new URLSearchParams({provider:String(t||""),accountId:String(e||"default")}),s=await Y(`/api/channels/accounts/token?${n.toString()}`);return fe(s,"Could not load channel token")},jm=async t=>{let e=await Y("/api/channels/accounts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t||{})});return fe(e,"Could not create channel account")},zm=async t=>{let e=await Y("/api/channels/accounts/jobs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t||{})});return fe(e,"Could not start channel account operation")},Um=({operationId:t="",onMessage:e=()=>{},onError:n=()=>{}})=>Bh({url:`/api/operations/${encodeURIComponent(String(t||""))}/events`,onMessage:e,onError:n}),Fr=async t=>{let e=await Y("/api/channels/accounts",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(t||{})});return fe(e,"Could not update channel account")},$a=async t=>{let e=await Y("/api/channels/accounts",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify(t||{})});return fe(e,"Could not delete channel account")};var Km=async t=>{let e=await Y(`/api/agents/${encodeURIComponent(String(t||""))}/workspace-size`);return fe(e,"Could not load workspace size")},Gm=async t=>{let e=await Y(`/api/agents/${encodeURIComponent(String(t||""))}/bindings`);return fe(e,"Could not load agent bindings")},qm=async t=>{let e=await Y("/api/agents",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t||{})});return fe(e,"Could not create agent")},Jm=async(t,e)=>{let n=await Y(`/api/agents/${encodeURIComponent(String(t||""))}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(e||{})});return fe(n,"Could not update agent")};var Zm=async(t,{keepWorkspace:e=!0}={})=>{let n=new URLSearchParams({keepWorkspace:e?"true":"false"}),s=await Y(`/api/agents/${encodeURIComponent(String(t||""))}?${n.toString()}`,{method:"DELETE"});return fe(s,"Could not delete agent")},Ym=async t=>{let e=await Y(`/api/agents/${encodeURIComponent(String(t||""))}/default`,{method:"POST"});return fe(e,"Could not set default agent")},Po=async()=>(await Y("/api/codex/status")).json(),Hr=async()=>(await Y("/api/codex/disconnect",{method:"POST"})).json(),Wr=async t=>(await Y("/api/codex/exchange",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({input:t})})).json();async function Vr(){return(await Y("/api/env")).json()}async function dd(t){let e=await Y("/api/env",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({vars:t})}),n=await e.text(),s;try{s=n?JSON.parse(n):{}}catch{throw new Error(n||"Could not parse env save response")}if(!e.ok)throw new Error(s.error||n||`HTTP ${e.status}`);return s}var fe=async(t,e)=>{let n=await t.text(),s;try{s=n?JSON.parse(n):{}}catch{throw new Error(n||e)}if(!t.ok||s?.ok===!1)throw new Error(s.error||n||`HTTP ${t.status}`);return s};async function Xm(){let t=await Y("/api/webhooks");return fe(t,"Could not load webhooks")}async function Qm(t){let e=await Y(`/api/webhooks/${encodeURIComponent(t)}`);return fe(e,"Could not load webhook detail")}async function eg(t,{destination:e=null,oauthCallback:n=!1}={}){let s=await Y("/api/webhooks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:t,...e?{destination:e}:{},oauthCallback:!!n})});return fe(s,"Could not create webhook")}async function tg(t,{deleteTransformDir:e=!1}={}){let n=await Y(`/api/webhooks/${encodeURIComponent(t)}`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({deleteTransformDir:!!e})});return fe(n,"Could not delete webhook")}async function ng(t,{destination:e=null}={}){let n=await Y(`/api/webhooks/${encodeURIComponent(t)}/destination`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({destination:e})});return fe(n,"Could not update webhook destination")}async function sg(t){let e=await Y(`/api/webhooks/${encodeURIComponent(t)}/oauth-callback/rotate`,{method:"POST"});return fe(e,"Could not rotate OAuth callback")}async function og(t,{limit:e=50,offset:n=0,status:s="all"}={}){let o=new URLSearchParams({limit:String(e),offset:String(n),status:String(s||"all")}),r=await Y(`/api/webhooks/${encodeURIComponent(t)}/requests?${o.toString()}`);return fe(r,"Could not load webhook requests")}async function rg(t,e){let n=await Y(`/api/webhooks/${encodeURIComponent(t)}/requests/${encodeURIComponent(String(e))}`);return fe(n,"Could not load webhook request")}var ig=async(t=10)=>{let e=new URLSearchParams({depth:String(t)}),n=await Y(`/api/browse/tree?${e.toString()}`);return fe(n,"Could not load file tree")},ud=async t=>{let e=new URLSearchParams({path:String(t||"")}),n=await Y(`/api/browse/read?${e.toString()}`);return fe(n,"Could not load file content")},ag=async(t,e)=>{let n=String(t||""),s=typeof e=="string"?e:String(e??""),o=await Y("/api/browse/write",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:n,content:s})});return fe(o,"Could not save file")},lg=async t=>{let e=await Y("/api/browse/create-file",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:String(t||"")})});return fe(e,"Could not create file")},cg=async t=>{let e=await Y("/api/browse/create-folder",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:String(t||"")})});return fe(e,"Could not create folder")},dg=async(t,e)=>{let n=await Y("/api/browse/move",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({from:String(t||""),to:String(e||"")})});return fe(n,"Could not move path")},wa=async t=>{let e=await Y("/api/browse/delete",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:String(t||"")})});return fe(e,"Could not delete file")},ug=async t=>{let e=new URLSearchParams({path:String(t||"")}),n=await Y(`/api/browse/download?${e.toString()}`);if(!n.ok){let a=await n.text();throw new Error(a||"Could not download file")}let s=await n.blob(),o=window?.URL||URL;if(!o?.createObjectURL||!o?.revokeObjectURL)throw new Error("Download is not supported in this browser");let r=o.createObjectURL(s),i=String(t||"").split("/").filter(Boolean).pop()||"download";try{let a=document.createElement("a");a.href=r,a.download=i,document.body?.appendChild(a),a.click(),a.remove()}finally{o.revokeObjectURL(r)}return{ok:!0}},pg=async t=>{let e=await Y("/api/browse/restore",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:String(t||"")})});return fe(e,"Could not restore file")},pd=async()=>{let t=await Y("/api/browse/git-summary");return fe(t,"Could not load git summary")},fg=async t=>{let e=new URLSearchParams({path:String(t||"")}),n=await Y(`/api/browse/git-diff?${e.toString()}`);return fe(n,"Could not load file diff")},hg=async({filePath:t,table:e,limit:n=50,offset:s=0})=>{let o=new URLSearchParams({path:String(t||""),table:String(e||""),limit:String(n),offset:String(s)}),r=await Y(`/api/browse/sqlite-table?${o.toString()}`);return fe(r,"Could not load sqlite table data")},mg=async(t="")=>{let e=await Y("/api/browse/git-sync",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:String(t||"")})});return fe(e,"Could not sync changes")};var js=t=>String(t||"").split("/")[0]||"",Ro=t=>{let e=String(t||"").trim();return e==="openai-codex"?"openai":e==="volcengine-plan"?"volcengine":e==="byteplus-plan"?"byteplus":e},jk=[{label:"Opus 4.6",preferredKeys:["anthropic/claude-opus-4-6"]},{label:"Sonnet 4.6",preferredKeys:["anthropic/claude-sonnet-4-6"]},{label:"Codex 5.3",preferredKeys:["openai-codex/gpt-5.3-codex"]},{label:"GPT-5.4",preferredKeys:["openai-codex/gpt-5.4"]},{label:"Gemini 3.1 Pro",preferredKeys:["google/gemini-3.1-pro-preview"]}],Lo=t=>{let e=[],n=new Set;return jk.forEach(s=>{let o=s.preferredKeys.map(r=>t.find(i=>i.key===r)).find(Boolean);!o||n.has(o.key)||(e.push({...o,featuredLabel:s.label}),n.add(o.key))}),e},Mn={anthropic:[{key:"ANTHROPIC_API_KEY",label:"Anthropic API Key",url:"https://console.anthropic.com",linkText:"Get key",placeholder:"sk-ant-..."},{key:"ANTHROPIC_TOKEN",label:"Anthropic Setup Token",hint:"From claude setup-token (uses your Claude subscription)",linkText:"Get token",placeholder:"Token..."}],openai:[{key:"OPENAI_API_KEY",label:"OpenAI API Key",url:"https://platform.openai.com",linkText:"Get key",placeholder:"sk-..."}],google:[{key:"GEMINI_API_KEY",label:"Gemini API Key",url:"https://aistudio.google.com",linkText:"Get key",placeholder:"AI..."}],opencode:[{key:"OPENCODE_API_KEY",label:"OpenCode API Key",placeholder:"oc-..."}],openrouter:[{key:"OPENROUTER_API_KEY",label:"OpenRouter API Key",url:"https://openrouter.ai",linkText:"Get key",placeholder:"sk-or-..."}],zai:[{key:"ZAI_API_KEY",label:"Z.AI API Key",placeholder:"zai-..."}],"vercel-ai-gateway":[{key:"AI_GATEWAY_API_KEY",label:"AI Gateway API Key",placeholder:"aigw_..."}],kilocode:[{key:"KILOCODE_API_KEY",label:"KiloCode API Key",placeholder:"kilo_..."}],xai:[{key:"XAI_API_KEY",label:"xAI API Key",placeholder:"xai-..."}],mistral:[{key:"MISTRAL_API_KEY",label:"Mistral API Key",url:"https://console.mistral.ai",linkText:"Get key",placeholder:"sk-..."}],voyage:[{key:"VOYAGE_API_KEY",label:"Voyage API Key",url:"https://dash.voyageai.com",linkText:"Get key",placeholder:"pa-..."}],groq:[{key:"GROQ_API_KEY",label:"Groq API Key",url:"https://console.groq.com",linkText:"Get key",placeholder:"gsk_..."}],cerebras:[{key:"CEREBRAS_API_KEY",label:"Cerebras API Key",placeholder:"csk-..."}],moonshot:[{key:"MOONSHOT_API_KEY",label:"Moonshot API Key",placeholder:"sk-..."}],"kimi-coding":[{key:"KIMI_API_KEY",label:"Kimi API Key",placeholder:"sk-..."}],volcengine:[{key:"VOLCANO_ENGINE_API_KEY",label:"Volcano Engine API Key",placeholder:"ve-..."}],byteplus:[{key:"BYTEPLUS_API_KEY",label:"BytePlus API Key",placeholder:"bp-..."}],synthetic:[{key:"SYNTHETIC_API_KEY",label:"Synthetic API Key",placeholder:"syn-..."}],minimax:[{key:"MINIMAX_API_KEY",label:"MiniMax API Key",placeholder:"minimax-..."}],deepgram:[{key:"DEEPGRAM_API_KEY",label:"Deepgram API Key",url:"https://console.deepgram.com",linkText:"Get key",placeholder:"dg-..."}],vllm:[{key:"VLLM_API_KEY",label:"vLLM API Key",placeholder:"vllm-local"}]},zs={anthropic:"Anthropic",openai:"OpenAI",google:"Gemini",opencode:"OpenCode Zen",openrouter:"OpenRouter",zai:"Z.AI","vercel-ai-gateway":"Vercel AI Gateway",kilocode:"Kilo Gateway",xai:"xAI",mistral:"Mistral",cerebras:"Cerebras",moonshot:"Moonshot","kimi-coding":"Kimi Coding",volcengine:"Volcano Engine",byteplus:"BytePlus",synthetic:"Synthetic",minimax:"MiniMax",voyage:"Voyage",groq:"Groq",deepgram:"Deepgram",vllm:"vLLM"},jr=["anthropic","openai","google","zai","xai","openrouter","opencode","kilocode","vercel-ai-gateway","minimax","moonshot","kimi-coding","volcengine","byteplus","synthetic","mistral","cerebras","voyage","groq","deepgram","vllm"];var gg=[{id:"embeddings",label:"Memory Embeddings",tag:"Embeddings",providers:["openai","google","voyage","mistral"]},{id:"audio",label:"Audio Transcription",tag:"Audio",hasDefault:!0,providers:["openai","groq","deepgram","google","mistral"]}],bg=t=>{if(t==="openai-codex")return new Set;let e=Ro(t),n=Mn[e]||[];return new Set(n.map(s=>s.key))},xg=Object.values(Mn).flat().filter((t,e,n)=>n.findIndex(s=>s.key===t.key)===e);var Eo=P.bind(T),fd="new",hd="existing",An="fresh",Bt="import",Tn="create",qn="existing-empty",zk=t=>String(t||"").trim().replace(/^git@github\.com:/,"").replace(/^https:\/\/github\.com\//,"").replace(/\.git$/,""),zr=t=>{let e=zk(t);if(!e)return!1;let n=e.split("/").filter(Boolean);return n.length===2&&!n.some(s=>/\s/.test(s))},Ht=[{id:"github",title:"GitHub",description:"Auto-backup your config and workspace",fields:[{key:"_GITHUB_SOURCE_REPO",label:"Source Repo",placeholder:"username/existing-openclaw",isText:!0},{key:"GITHUB_WORKSPACE_REPO",label:"New Workspace Repo",placeholder:"username/my-agent",isText:!0},{key:"GITHUB_TOKEN",label:"Personal Access Token",hint:Eo`Create a${" "}<a
            href="https://github.com/settings/tokens"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >classic PAT</a
          >${" "}with${" "}<code class="text-xs bg-field px-1 rounded"
            >repo</code
          >${" "}scope, or a${" "}<a
            href="https://github.com/settings/personal-access-tokens/new"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >fine-grained token</a
          >${" "}with Contents + Metadata access`,placeholder:"ghp_... or github_pat_..."}],validate:t=>{let e=t._GITHUB_FLOW||An,n=zr(t.GITHUB_WORKSPACE_REPO),s=e!==Bt||zr(t._GITHUB_SOURCE_REPO);return!!(t.GITHUB_TOKEN&&n&&s)}},{id:"ai",title:"Primary Agent Model",description:"Choose your main model and authenticate its provider",fields:xg,validate:(t,e={})=>!!(t.MODEL_KEY&&e.hasAi)},{id:"channels",title:"Channels",description:"At least one is required to talk to your agent",fields:[{key:"TELEGRAM_BOT_TOKEN",label:"Telegram Bot Token",hint:Eo`From${" "}<a
            href="https://t.me/BotFather"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >@BotFather</a
          >${" "}·${" "}<a
            href="https://docs.openclaw.ai/channels/telegram"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >full guide</a
          >`,placeholder:"123456789:AAH..."},{key:"DISCORD_BOT_TOKEN",label:"Discord Bot Token",hint:Eo`From${" "}<a
            href="https://discord.com/developers/applications"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >Developer Portal</a
          >${" "}·${" "}<a
            href="https://docs.openclaw.ai/channels/discord"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >full guide</a
          >`,placeholder:"MTQ3..."},{key:"SLACK_BOT_TOKEN",label:"Slack Bot Token",hint:Eo`From your Slack app's${" "}<a
            href="https://api.slack.com/apps"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >OAuth & Permissions</a
          >${" "}page${" "}·${" "}<a
            href="https://docs.openclaw.ai/channels/slack"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >full guide</a
          >`,placeholder:"xoxb-..."},{key:"SLACK_APP_TOKEN",label:"Slack App Token (Socket Mode)",hint:Eo`From${" "}<a
            href="https://api.slack.com/apps"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >Basic Information</a
          >${" "}→ App-Level Tokens (needs${" "}<code>connections:write</code>${" "}scope)`,placeholder:"xapp-..."}],validate:t=>!!(t.TELEGRAM_BOT_TOKEN||t.DISCORD_BOT_TOKEN||t.SLACK_BOT_TOKEN&&t.SLACK_APP_TOKEN)},{id:"tools",title:"Tools (optional)",description:"Enable extra capabilities for your agent",fields:[{key:"BRAVE_API_KEY",label:"Brave Search API Key",hint:Eo`From${" "}<a
            href="https://brave.com/search/api/"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >brave.com/search/api</a
          >${" "}-${" "}free tier available`,placeholder:"BSA..."}],validate:()=>!0}];var Uk=P.bind(T),yg=({onSelectFlow:t})=>Uk`
    <div class="space-y-3">
      <button
        type="button"
        onclick=${()=>t(An)}
        class="w-full flex items-center gap-4 text-left p-4 rounded-xl ac-path-card"
      >
        <div
          class="ac-path-icon flex-shrink-0 w-10 h-10 flex items-center justify-center bg-field rounded-lg border border-border text-body"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-5 h-5"
          >
            <path
              d="M14 4.4375C15.3462 4.4375 16.4375 3.34619 16.4375 2H17.5625C17.5625 3.34619 18.6538 4.4375 20 4.4375V5.5625C18.6538 5.5625 17.5625 6.65381 17.5625 8H16.4375C16.4375 6.65381 15.3462 5.5625 14 5.5625V4.4375ZM1 11C4.31371 11 7 8.31371 7 5H9C9 8.31371 11.6863 11 15 11V13C11.6863 13 9 15.6863 9 19H7C7 15.6863 4.31371 13 1 13V11ZM4.87601 12C6.18717 12.7276 7.27243 13.8128 8 15.124 8.72757 13.8128 9.81283 12.7276 11.124 12 9.81283 11.2724 8.72757 10.1872 8 8.87601 7.27243 10.1872 6.18717 11.2724 4.87601 12ZM17.25 14C17.25 15.7949 15.7949 17.25 14 17.25V18.75C15.7949 18.75 17.25 20.2051 17.25 22H18.75C18.75 20.2051 20.2051 18.75 22 18.75V17.25C20.2051 17.25 18.75 15.7949 18.75 14H17.25Z"
            ></path>
          </svg>
        </div>
        <div>
          <div
            class="ac-path-title text-sm font-medium text-body mb-0.5 transition-colors duration-150"
          >
            Start fresh
          </div>
          <div
            class="ac-path-desc text-xs text-fg-muted transition-colors duration-150"
          >
            Create a new repository and set up your agent from scratch.
          </div>
        </div>
      </button>

      <button
        type="button"
        onclick=${()=>t(Bt)}
        class="w-full flex items-center gap-4 text-left p-4 rounded-xl ac-path-card"
      >
        <div
          class="ac-path-icon flex-shrink-0 w-10 h-10 flex items-center justify-center bg-field rounded-lg border border-border text-body"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-5 h-5"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <div
              class="ac-path-title text-sm font-medium text-body transition-colors duration-150"
            >
              Import existing setup
            </div>
            <span class="shrink-0 ml-1 text-[11px] text-status-warning">
              Experimental
            </span>
          </div>
          <div
            class="ac-path-desc text-xs text-fg-muted transition-colors duration-150"
          >
            Connect an existing repository that already has an OpenClaw setup.
          </div>
        </div>
      </button>
    </div>
  `;var Kk=P.bind(T),Ce=({className:t="h-4 w-4",ariaHidden:e=!0,style:n=""})=>Kk`
  <svg
    class=${`ac-spinner ${t}`.trim()}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden=${e?"true":"false"}
    style=${n}
  >
    <circle
      class="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4"
    />
    <path
      class="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
`;var Io=P.bind(T),vg={primary:"ac-btn-cyan",secondary:"ac-btn-secondary",success:"ac-btn-green",danger:"ac-btn-danger",ghost:"ac-btn-ghost"},Gk=(t,e)=>t==="subtle"||t==="neutral"?e?"border border-border text-fg-muted hover:text-body hover:border-fg-muted":"border border-border text-fg-muted":t==="warning"?e?"border border-yellow-500/35 text-status-warning-muted bg-yellow-500/10 hover:border-yellow-400/60 hover:text-status-warning hover:bg-yellow-500/15":"border border-yellow-500/35 text-status-warning-muted bg-yellow-500/10":vg[t]||vg.primary,$g={sm:"h-7 text-xs leading-none px-2.5 py-1 rounded-lg",md:"h-9 text-sm font-medium leading-none px-4 rounded-xl",lg:"h-10 text-sm font-medium leading-none px-5 rounded-lg"},wg={sm:"h-7 w-7 p-0 rounded-lg",md:"h-9 w-9 p-0 rounded-xl",lg:"h-10 w-10 p-0 rounded-lg"},Z=({onClick:t,type:e="button",disabled:n=!1,loading:s=!1,tone:o="primary",size:r="sm",idleLabel:i="Action",loadingLabel:a="Working...",loadingMode:l="replace",className:c="",idleIcon:d=null,idleIconClassName:u="h-3 w-3",iconOnly:p=!1,title:f="",ariaLabel:g=""})=>{let m=n||s,b=Gk(o,!m),x=p?wg[r]||wg.sm:$g[r]||$g.sm,v=s?`cursor-not-allowed ${o==="warning"?"opacity-90 animate-pulse shadow-[0_0_0_1px_rgba(234,179,8,0.22),0_0_18px_rgba(234,179,8,0.12)]":"opacity-80"}`:"",w=r==="md"||r==="lg"?"h-4 w-4":"h-3 w-3",$=l==="inline",S=d,C=p&&S?Io`<${S} className=${u} />`:S?Io`
            <span class="inline-flex items-center gap-1.5 leading-none">
              <${S} className=${u} />
              ${i}
            </span>
          `:i,_=s&&!$?a:C;return Io`
    <button
      type=${e}
      onclick=${t}
      disabled=${m}
      title=${f}
      aria-label=${g||null}
      class="inline-flex items-center justify-center transition-colors whitespace-nowrap ${x} ${b} ${v} ${c}"
    >
      ${$?Io`
            <span
              class="relative inline-flex items-center justify-center leading-none"
            >
              <span class=${s?"invisible":""}>${_}</span>
              ${s?Io`
                    <span
                      class="absolute inset-0 inline-flex items-center justify-center"
                    >
                      <${Ce} className=${w} />
                    </span>
                  `:null}
            </span>
          `:s?Io`
              <span class="inline-flex items-center gap-1.5 leading-none">
                <${Ce} className=${w} />
                ${_}
              </span>
            `:_}
    </button>
  `};var ka=(t=[])=>(Array.isArray(t)?t:[]).filter(e=>e?.confidence==="high").map(e=>({...e,suggestedEnvVar:e?.suggestedEnvVar||""})),kg=(t=[])=>(Array.isArray(t)?t:[]).reduce((e,n)=>{let s=String(n?.suggestedEnvVar||"").trim(),o=String(n?.value||"");return!s||!o||(e[s]=o),e},{});var qt=P.bind(T),qk=[{key:"gatewayConfig",label:"Gateway Config",icon:"\u2699\uFE0F",description:"openclaw.json configuration",showFiles:!0},{key:"envFiles",label:"Environment Files",icon:"\u{1F510}",description:".env files with variables",showFiles:!0},{key:"workspaceFiles",label:"Workspace Files",icon:"\u{1F4C4}",description:"Prompt files (AGENTS.md, SOUL.md, etc.)",showFiles:!0},{key:"skills",label:"Skills",icon:"\u{1F6E0}",description:"Custom skill definitions",showFiles:!0},{key:"cronJobs",label:"Cron Jobs",icon:"\u23F0",description:"Scheduled tasks",showFiles:!0},{key:"webhooks",label:"Hooks",icon:"\u{1F517}",description:"Webhook mappings and internal hooks",showDirs:!0},{key:"memory",label:"Memory",icon:"\u{1F9E0}",description:"Agent memory and embeddings",showDirs:!0}],Jk=({category:t,data:e})=>{let[n,s]=y(!1);if(!e?.found)return null;let o=t.key==="webhooks",r=Array.isArray(e.transformWarnings)?e.transformWarnings:[],i=new Set(r.map(d=>String(d.actualPath||"").trim()).filter(Boolean).map(d=>d.split("/").slice(0,-2).join("/"))),a=[...e.jobNames||[],...e.hookNames||[],...e.files||[],...(e.dirs||[]).filter(d=>!i.has(d)),...e.extraMarkdown||[]],l=typeof e.jobCount=="number"&&e.jobCount>0?e.jobCount:typeof e.hookCount=="number"&&e.hookCount>0?e.hookCount:a.length,c=typeof e.warningCount=="number"?e.warningCount:r.length;return qt`
    <div class="border border-border rounded-lg p-3">
      <button
        type="button"
        onclick=${()=>s(d=>!d)}
        class="w-full flex items-center justify-between text-left"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm">${t.icon}</span>
          <span class="text-xs font-medium text-body"
            >${t.label}</span
          >
          <span
            class="text-xs px-1.5 py-0.5 rounded-full bg-status-info-bg text-status-info"
            >${l}</span
          >
        </div>
        <div class="flex items-center gap-2">
          ${c>0?qt`
                <span
                  class="text-xs px-1.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning"
                >
                  ⚠ ${c}
                </span>
              `:null}
          <span class="text-xs text-fg-muted">${n?"\u25B2":"\u25BC"}</span>
        </div>
      </button>
      ${n&&a.length>0&&qt`
        <div class="mt-2 space-y-1">
          ${a.map(d=>qt`
              <div
                class="text-xs font-mono bg-field rounded px-2 py-1 text-fg-muted"
              >
                ${d}
              </div>
            `)}
          ${o?r.map(d=>qt`
                  <div
                    class="text-xs font-mono bg-field rounded px-2 py-1 text-status-warning"
                  >
                    ${d.actualPath}
                  </div>
                `):null}
        </div>
      `}
    </div>
  `},Sg=({scanResult:t,scanning:e,error:n,onApprove:s,onShowSecretReview:o,onBack:r})=>{if(e)return qt`
      <div class="flex flex-col items-center justify-center py-8 gap-3">
        <${Ce} />
        <p class="text-sm text-fg-muted">Scanning repository...</p>
      </div>
    `;if(n)return qt`
      <div class="space-y-3">
        <div
          class="bg-status-error-bg border border-status-error-border rounded-xl p-3 text-status-error text-sm"
        >
          ${n}
        </div>
        <button
          onclick=${r}
          class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all ac-btn-secondary"
        >
          Back
        </button>
      </div>
    `;if(!t)return null;let i=(t.secrets||[]).length,a=t.managedConflicts?.found;return qt`
    <div class="space-y-3">
      <div>
        <h2 class="text-sm font-medium text-body">Import Summary</h2>
        <p class="text-xs text-fg-muted">
          ${t.hasOpenclawSetup?"Found an existing OpenClaw setup":"No OpenClaw config detected \u2014 we'll set up fresh after import"}
        </p>
      </div>

      <div class="space-y-2">
        ${qk.map(l=>qt`
            <${Jk}
              key=${l.key}
              category=${l}
              data=${t[l.key]}
            />
          `)}
      </div>

      ${t.credentials?.found&&qt`
        <div
          class="bg-status-warning-bg border border-status-warning-border rounded-lg p-3 text-xs text-status-warning"
        >
          Deployment-specific files found (credentials, device identity) — these
          will not be imported.
        </div>
      `}
      ${a&&qt`
        <div
          class="bg-status-warning-bg border border-status-warning-border rounded-lg p-3 text-xs text-status-warning"
        >
          AlphaClaw-managed files detected
          (${(t.managedConflicts.files||[]).join(", ")}). These will
          be overwritten with AlphaClaw defaults.
        </div>
      `}
      ${t.managedEnvConflicts?.found?qt`
            <div
              class="bg-status-warning-bg border border-status-warning-border rounded-lg p-3 text-xs text-status-warning"
            >
              AlphaClaw controls deployment tokens and env vars
              (${(t.managedEnvConflicts.vars||[]).join(", ")}).
              Imported values for these will be overwritten with
              AlphaClaw-managed env var references during import.
            </div>
          `:null}
      ${t.webhooks?.warningCount>0?qt`
            <div
              class="bg-status-warning-bg border border-status-warning-border rounded-lg p-3 text-xs text-status-warning"
            >
              AlphaClaw expects hook transforms at
              <code class="text-xs bg-field px-1 rounded"
                >hooks/transforms/name/name-transform.mjs</code
              >. We found some that do not match and will try to patch them
              during import. The originals will be backed up under
              <code class="text-xs bg-field px-1 rounded"
                >hooks/transforms/_backup</code
              >.
            </div>
          `:null}
      ${i>0&&qt`
        <div
          class="bg-status-info-bg border border-status-info-border rounded-lg p-3 flex items-center justify-between"
        >
          <div>
            <span class="text-xs text-status-info font-medium">
              ${`${i} possible secret${i===1?"":"s"} detected`}
            </span>
            <p class="text-xs text-fg-muted mt-0.5">
              Review and extract to environment variables
            </p>
          </div>
          <${Z}
            onClick=${o}
            tone="primary"
            size="sm"
            idleLabel="Review"
            className="font-medium"
          />
        </div>
      `}

      <div class="grid grid-cols-2 gap-2 pt-1">
        <${Z}
          onClick=${r}
          tone="secondary"
          size="md"
          idleLabel="Back"
          className="w-full"
        />
        <${Z}
          onClick=${()=>s(ka(t.secrets))}
          loading=${e}
          tone="primary"
          size="md"
          idleLabel="Import"
          loadingLabel="Importing..."
          className="w-full"
        />
      </div>
    </div>
  `};var md=P.bind(T),Rt=({value:t="",onInput:e,onBlur:n,placeholder:s="",inputClass:o="",disabled:r=!1,loading:i=!1,isSecret:a=!0})=>{let[l,c]=y(!1),d=a,u=r||i;return md`
    <div class="flex-1 min-w-0 flex items-center gap-1">
      <input
        type=${a&&!l?"password":"text"}
        value=${t}
        placeholder=${s}
        onInput=${e}
        onBlur=${n}
        disabled=${u}
        class=${o}
        autocomplete="off"
      />
      ${i?md`<${Ce} className="h-3 w-3 text-fg-muted shrink-0" />`:null}
      ${d?md`<button
            type="button"
            onclick=${()=>c(p=>!p)}
            disabled=${u}
            class="text-fg-muted hover:text-body px-1 text-xs shrink-0"
          >
            ${l?"Hide":"Show"}
          </button>`:null}
    </div>
  `};var gd=P.bind(T),Zk=t=>{let e=String(t||"").trim();return!!e&&e!=="placeholder"},Yk=({item:t,value:e,onInput:n})=>gd`
    <div class="border border-border rounded-lg p-3 space-y-2">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <code
              class="text-xs text-body bg-field px-1.5 py-0.5 rounded"
              >${t.key}</code
            >
          </div>
        </div>
      </div>
      <${Rt}
        value=${e}
        onInput=${s=>n(s.target.value)}
        placeholder="Enter value"
        inputClass="w-full bg-field border border-border rounded-lg px-3 py-2 text-xs text-body outline-none focus:border-fg-muted font-mono"
      />
    </div>
  `,Cg=({placeholderReview:t,vals:e,setValue:n,onContinue:s})=>{let o=Array.isArray(t?.vars)?t.vars:[],i=F(()=>o.filter(a=>!Zk(e[a.key])).map(a=>a.key),[o,e]).length;return o.length===0?null:gd`
    <div class="space-y-3">
      <div>
        <h2 class="text-sm font-medium text-body">Add Missing Env Vars</h2>
      </div>

      <div class="space-y-2 max-h-80 overflow-y-auto">
        ${o.map(a=>gd`
            <${Yk}
              key=${a.key}
              item=${a}
              value=${String(e[a.key]||"")==="placeholder"?"":e[a.key]||""}
              onInput=${l=>n(a.key,l)}
            />
          `)}
      </div>

      <div
        class="bg-status-warning-bg border border-status-warning-border rounded-lg p-3 text-xs text-status-warning"
      >
        ${i>0?`${i} detected env var${i===1?"":"s"} need values. You can continue without them, but the gateway might fail to start.`:"All imported placeholder env vars have values now."}
      </div>

      <div class="pt-1">
        <${Z}
          onClick=${s}
          tone="primary"
          size="md"
          idleLabel=${i>0?`Continue with ${i} Unresolved`:"Continue"}
          className="w-full"
        />
      </div>
    </div>
  `};var Pn=P.bind(T),Xk=({secret:t,selected:e,onToggle:n,envVarName:s,onEnvVarChange:o})=>Pn`
    <div
      class="border border-border rounded-lg p-3 space-y-2 ${e?"bg-status-info-bg border-status-info-border":""}"
    >
      <div class="flex items-start gap-2">
        <input
          type="checkbox"
          checked=${e}
          onChange=${n}
          class="mt-0.5 rounded"
        />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-mono text-body truncate"
              >${t.maskedValue}</span
            >
            ${t.confidence==="high"?Pn`<span
                  class="text-xs px-1.5 py-0.5 rounded-full bg-status-error-bg text-status-error"
                  >high confidence</span
                >`:Pn`<span
                  class="text-xs px-1.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning"
                  >possible</span
                >`}
          </div>
          <div class="text-xs text-fg-muted mt-1">
            Found in${" "}
            <span class="font-mono">${t.file||"config"}</span>
            ${t.configPath?Pn` at <span class="font-mono">${t.configPath}</span>`:null}
          </div>
          ${t.duplicateIn&&Pn`
            <div class="text-xs text-status-warning-muted mt-1">
              Also found in${" "}<span class="font-mono"
                >${t.duplicateIn}</span
              >
            </div>
          `}
        </div>
      </div>
      ${e&&Pn`
        <div class="pl-6">
          <label class="text-xs text-fg-muted">Extract as env var:</label>
          <input
            type="text"
            value=${s}
            onInput=${r=>o(r.target.value)}
            class="w-full mt-1 bg-field border border-border rounded-lg px-3 py-1.5 text-xs text-body outline-none focus:border-fg-muted font-mono"
          />
        </div>
      `}
    </div>
  `,_g=({secrets:t=[],onApprove:e,onBack:n,loading:s,error:o})=>{let[r,i]=y(()=>{let u={};for(let p of t)u[p.configPath]={selected:p.confidence==="high",envVarName:p.suggestedEnvVar||""};return u}),a=q(u=>{i(p=>({...p,[u]:{...p[u],selected:!p[u]?.selected}}))},[]),l=q((u,p)=>{i(f=>({...f,[u]:{...f[u],envVarName:p}}))},[]),c=Object.values(r).filter(u=>u.selected).length,d=()=>{let u=ka(t.map(p=>({...p,confidence:r[p.configPath]?.selected?"high":"medium",suggestedEnvVar:r[p.configPath]?.envVarName||p.suggestedEnvVar})));e(u)};return s?Pn`
      <div class="flex flex-col items-center justify-center py-8 gap-3">
        <${Ce} />
        <p class="text-sm text-fg-muted">Applying import...</p>
      </div>
    `:Pn`
    <div class="space-y-3">
      <div>
        <h2 class="text-sm font-medium text-body">Review Secrets</h2>
        <p class="text-xs text-fg-muted">
          Select secrets to extract into environment variables. Inline values in
          config will be replaced with ${"`"}${"${"}ENV_VAR_NAME${"}"}${"`"} references.
        </p>
      </div>

      ${o&&Pn`
        <div
          class="bg-status-error-bg border border-status-error-border rounded-xl p-3 text-status-error text-sm"
        >
          ${o}
        </div>
      `}

      <div class="space-y-2 max-h-80 overflow-y-auto">
        ${t.map(u=>Pn`
            <${Xk}
              key=${u.configPath}
              secret=${u}
              selected=${r[u.configPath]?.selected||!1}
              envVarName=${r[u.configPath]?.envVarName||""}
              onToggle=${()=>a(u.configPath)}
              onEnvVarChange=${p=>l(u.configPath,p)}
            />
          `)}
      </div>

      <div class="grid grid-cols-2 gap-2 pt-1">
        <${Z}
          onClick=${n}
          tone="secondary"
          size="md"
          idleLabel="Back"
          className="w-full"
        />
        <${Z}
          onClick=${d}
          tone="primary"
          size="md"
          idleLabel=${c>0?`Extract ${c} Secret${c===1?"":"s"}`:"Skip All"}
          className="w-full"
        />
      </div>
    </div>
  `};var Mg=P.bind(T),Ag=({groups:t,step:e,isPreStep:n,isSetupStep:s,isPairingStep:o,stepNumber:r,activeStepLabel:i})=>{let a=[...t,{id:"setup",title:"Initializing"},{id:"pairing",title:"Pairing"}];return Mg`
    <div class="text-center mb-1">
      <img
        src="./img/logo.svg"
        alt="alphaclaw"
        class="mx-auto mb-3"
        width="32"
        height="33"
      />
      <h1 class="text-2xl font-semibold mb-2">Setup</h1>
      <p style="color: var(--text-muted)" class="text-sm">
        Let's get your agent running
      </p>
      <div class="mt-4 mb-2 flex items-center justify-center">
        <span
          class="text-[11px] px-2.5 py-1 rounded-full border border-border font-medium"
          style="background: rgba(0, 0, 0, 0.3); color: var(--text-muted)"
        >
          ${n?"Choose your destiny":`Step ${r} of ${a.length} - ${i}`}
        </span>
      </div>
    </div>

    <div class="flex items-center gap-2">
      ${a.map((l,c)=>{let d=c===e,u=c<e||s&&l.id==="setup",p=c<e||o&&l.id==="pairing",f=n?"rgba(82, 94, 122, 0.45)":d?"rgba(99, 235, 255, 0.9)":l.id==="pairing"?p?"rgba(99, 235, 255, 0.55)":"rgba(82, 94, 122, 0.45)":u?"rgba(99, 235, 255, 0.55)":"rgba(82, 94, 122, 0.45)";return Mg`
          <div
            class="h-1 flex-1 rounded-full transition-colors ${d?"ac-step-pill-pulse":""}"
            style=${{background:f}}
            title=${l.title}
          ></div>
        `})}
    </div>
  `};var Tg=P.bind(T),Pg=[{label:"\u{1F6E1}\uFE0F Safety tip",text:"Be careful what you give access to. Read access is always safer than write access."},{label:"\u{1F9E0} Best practice",text:"Trust but verify. Your agent may not always know what it's doing, so check the results."},{label:"\u{1F4A1} Idea",text:"Ask your agent to create a morning briefing for you."},{label:"\u{1F9E0} Best practice",text:"Ask your agent to review its own code and make sure it's doing what you want it to do."},{label:"\u{1F4A1} Idea",text:"Tell your agent to review the latest news and provide a summary."},{label:"\u{1F6E1}\uFE0F Safety tip",text:"Be incredibly careful installing skills from the internet - they may contain malicious code."}],Rg=({error:t,loading:e,onRetry:n,onBack:s})=>{let[o,r]=y(0);if(L(()=>{if(t||!e)return;let a=setInterval(()=>{r(l=>(l+1)%Pg.length)},5200);return()=>clearInterval(a)},[t,e]),t)return Tg`
      <div class="py-4 flex flex-col items-center text-center gap-3">
        <h3 class="text-lg font-semibold text-white">Setup failed</h3>
        <p class="text-sm text-fg-muted">Fix the values and try again.</p>
      </div>
      <div
        class="bg-status-error-bg border border-status-error-border rounded-xl p-3 text-status-error text-sm"
      >
        ${t}
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button
          onclick=${s}
          disabled=${e}
          class="w-full text-sm font-medium px-4 py-3 rounded-xl transition-all ac-btn-secondary ${e?"opacity-50 cursor-not-allowed":""}"
        >
          Back
        </button>
        <button
          onclick=${n}
          disabled=${e}
          class="w-full text-sm font-medium px-4 py-3 rounded-xl transition-all ac-btn-cyan ${e?"opacity-50 cursor-not-allowed":""}"
        >
          ${e?"Retrying...":"Retry"}
        </button>
      </div>
    `;let i=Pg[o];return Tg`
    <div class="relative min-h-[320px] pt-4 pb-20 flex">
      <div
        class="flex-1 flex flex-col items-center justify-center text-center gap-4"
      >
        <${Ce} className="h-8 w-8 text-white" />
        <h3 class="text-lg font-semibold text-white">
          Initializing OpenClaw...
        </h3>
        <p class="text-sm text-fg-muted">This could take 10-15 seconds</p>
      </div>
      <div
        class="absolute bottom-3 left-3 right-3 bg-field border border-border rounded-lg px-3 py-2 text-xs text-fg-muted"
      >
        <span class="text-fg-muted">${i.label}: </span>
        ${i.text}
      </div>
    </div>
  `};var Qk=P.bind(T),Lg={success:"bg-green-500/10 text-status-success-muted",warning:"bg-yellow-500/10 text-status-warning-muted",danger:"bg-red-500/10 text-status-error-muted",neutral:"bg-gray-500/10 text-fg-muted",info:"bg-blue-500/10 text-blue-400",accent:"bg-purple-500/10 text-purple-400",cyan:"bg-cyan-500/10 text-cyan-400",secondary:"bg-indigo-500/10 text-indigo-300"},ae=({tone:t="neutral",children:e})=>Qk`
  <span class="text-xs px-2 py-0.5 rounded-full font-medium ${Lg[t]||Lg.neutral}">
    ${e}
  </span>
`;function tS(t,e){for(var n in e)t[n]=e[n];return t}function Eg(t,e){for(var n in t)if(n!=="__source"&&!(n in e))return!0;for(var s in e)if(s!=="__source"&&t[s]!==e[s])return!0;return!1}function Ig(t,e){this.props=t,this.context=e}(Ig.prototype=new hn).isPureReactComponent=!0,Ig.prototype.shouldComponentUpdate=function(t,e){return Eg(this.props,t)||Eg(this.state,e)};var Dg=Se.__b;Se.__b=function(t){t.type&&t.type.__f&&t.ref&&(t.props.ref=t.ref,t.ref=null),Dg&&Dg(t)};var xL=typeof Symbol<"u"&&Symbol.for&&Symbol.for("react.forward_ref")||3911;var nS=Se.__e;Se.__e=function(t,e,n,s){if(t.then){for(var o,r=e;r=r.__;)if((o=r.__c)&&o.__c)return e.__e==null&&(e.__e=n.__e,e.__k=n.__k),o.__c(t,e)}nS(t,e,n,s)};var Ng=Se.unmount;function Vg(t,e,n){return t&&(t.__c&&t.__c.__H&&(t.__c.__H.__.forEach(function(s){typeof s.__c=="function"&&s.__c()}),t.__c.__H=null),(t=tS({},t)).__c!=null&&(t.__c.__P===n&&(t.__c.__P=e),t.__c.__e=!0,t.__c=null),t.__k=t.__k&&t.__k.map(function(s){return Vg(s,e,n)})),t}function jg(t,e,n){return t&&n&&(t.__v=null,t.__k=t.__k&&t.__k.map(function(s){return jg(s,e,n)}),t.__c&&t.__c.__P===e&&(t.__e&&n.appendChild(t.__e),t.__c.__e=!0,t.__c.__P=n)),t}function bd(){this.__u=0,this.o=null,this.__b=null}function zg(t){var e=t.__&&t.__.__c;return e&&e.__a&&e.__a(t)}function Sa(){this.i=null,this.l=null}Se.unmount=function(t){var e=t.__c;e&&(e.__z=!0),e&&e.__R&&e.__R(),e&&32&t.__u&&(t.type=null),Ng&&Ng(t)},(bd.prototype=new hn).__c=function(t,e){var n=e.__c,s=this;s.o==null&&(s.o=[]),s.o.push(n);var o=zg(s.__v),r=!1,i=function(){r||s.__z||(r=!0,n.__R=null,o?o(l):l())};n.__R=i;var a=n.__P;n.__P=null;var l=function(){if(!--s.__u){if(s.state.__a){var c=s.state.__a;s.__v.__k[0]=jg(c,c.__c.__P,c.__c.__O)}var d;for(s.setState({__a:s.__b=null});d=s.o.pop();)d.__P=a,d.forceUpdate()}};s.__u++||32&e.__u||s.setState({__a:s.__b=s.__v.__k[0]}),t.then(i,i)},bd.prototype.componentWillUnmount=function(){this.o=[]},bd.prototype.render=function(t,e){if(this.__b){if(this.__v.__k){var n=document.createElement("div"),s=this.__v.__k[0].__c;this.__v.__k[0]=Vg(this.__b,n,s.__O=s.__P)}this.__b=null}var o=e.__a&&T(ln,null,t.fallback);return o&&(o.__u&=-33),[T(ln,null,e.__a?null:t.children),o]};var Og=function(t,e,n){if(++n[1]===n[0]&&t.l.delete(e),t.props.revealOrder&&(t.props.revealOrder[0]!=="t"||!t.l.size))for(n=t.i;n;){for(;n.length>3;)n.pop()();if(n[1]<n[0])break;t.i=n=n[2]}};function sS(t){return this.getChildContext=function(){return t.context},t.children}function oS(t){var e=this,n=t.h;if(e.componentWillUnmount=function(){wo(null,e.v),e.v=null,e.h=null},e.h&&e.h!==n&&e.componentWillUnmount(),!e.v){for(var s=e.__v;s!==null&&!s.__m&&s.__!==null;)s=s.__;e.h=n,e.v={nodeType:1,parentNode:n,childNodes:[],__k:{__m:s.__m},contains:function(){return!0},namespaceURI:n.namespaceURI,insertBefore:function(o,r){this.childNodes.push(o),e.h.insertBefore(o,r)},removeChild:function(o){this.childNodes.splice(this.childNodes.indexOf(o)>>>1,1),e.h.removeChild(o)}}}wo(T(sS,{context:e.context},t.__v),e.v)}function Do(t,e){var n=T(oS,{__v:t,h:e});return n.containerInfo=e,n}(Sa.prototype=new hn).__a=function(t){var e=this,n=zg(e.__v),s=e.l.get(t);return s[0]++,function(o){var r=function(){e.props.revealOrder?(s.push(o),Og(e,t,s)):o()};n?n(r):r()}},Sa.prototype.render=function(t){this.i=null,this.l=new Map;var e=Lr(t.children);t.revealOrder&&t.revealOrder[0]==="b"&&e.reverse();for(var n=e.length;n--;)this.l.set(e[n],this.i=[1,0,this.i]);return t.children},Sa.prototype.componentDidUpdate=Sa.prototype.componentDidMount=function(){var t=this;this.l.forEach(function(e,n){Og(t,n,e)})};var rS=typeof Symbol<"u"&&Symbol.for&&Symbol.for("react.element")||60103,iS=/^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,aS=/^on(Ani|Tra|Tou|BeforeInp|Compo)/,lS=/[A-Z0-9]/g,cS=typeof document<"u",dS=function(t){return(typeof Symbol<"u"&&typeof Symbol()=="symbol"?/fil|che|rad/:/fil|che|ra/).test(t)};hn.prototype.isReactComponent=!0,["componentWillMount","componentWillReceiveProps","componentWillUpdate"].forEach(function(t){Object.defineProperty(hn.prototype,t,{configurable:!0,get:function(){return this["UNSAFE_"+t]},set:function(e){Object.defineProperty(this,t,{configurable:!0,writable:!0,value:e})}})});var Bg=Se.event;Se.event=function(t){return Bg&&(t=Bg(t)),t.persist=function(){},t.isPropagationStopped=function(){return this.cancelBubble},t.isDefaultPrevented=function(){return this.defaultPrevented},t.nativeEvent=t};var Ug,uS={configurable:!0,get:function(){return this.class}},Fg=Se.vnode;Se.vnode=function(t){typeof t.type=="string"&&(function(e){var n=e.props,s=e.type,o={},r=s.indexOf("-")==-1;for(var i in n){var a=n[i];if(!(i==="value"&&"defaultValue"in n&&a==null||cS&&i==="children"&&s==="noscript"||i==="class"||i==="className")){var l=i.toLowerCase();i==="defaultValue"&&"value"in n&&n.value==null?i="value":i==="download"&&a===!0?a="":l==="translate"&&a==="no"?a=!1:l[0]==="o"&&l[1]==="n"?l==="ondoubleclick"?i="ondblclick":l!=="onchange"||s!=="input"&&s!=="textarea"||dS(n.type)?l==="onfocus"?i="onfocusin":l==="onblur"?i="onfocusout":aS.test(i)&&(i=l):l=i="oninput":r&&iS.test(i)?i=i.replace(lS,"-$&").toLowerCase():a===null&&(a=void 0),l==="oninput"&&o[i=l]&&(i="oninputCapture"),o[i]=a}}s=="select"&&(o.multiple&&Array.isArray(o.value)&&(o.value=Lr(n.children).forEach(function(c){c.props.selected=o.value.indexOf(c.props.value)!=-1})),o.defaultValue!=null&&(o.value=Lr(n.children).forEach(function(c){c.props.selected=o.multiple?o.defaultValue.indexOf(c.props.value)!=-1:o.defaultValue==c.props.value}))),n.class&&!n.className?(o.class=n.class,Object.defineProperty(o,"className",uS)):n.className&&(o.class=o.className=n.className),e.props=o})(t),t.$$typeof=rS,Fg&&Fg(t)};var Hg=Se.__r;Se.__r=function(t){Hg&&Hg(t),Ug=t.__c};var Wg=Se.diffed;Se.diffed=function(t){Wg&&Wg(t);var e=t.props,n=t.__e;n!=null&&t.type==="textarea"&&"value"in e&&e.value!==n.value&&(n.value=e.value==null?"":e.value),Ug=null};var Kg=P.bind(T),Ur=8,xd=8,pS=400,Gg=0,qg=t=>{if(!t||typeof document>"u")return!1;let e=document.activeElement;return!e||!t.contains(e)?!1:typeof e.matches=="function"&&e.matches(":focus-visible")},fS=(t,e)=>{if(!t)return null;let n=t.getBoundingClientRect(),s=e?.getBoundingClientRect?.()||{width:0,height:0},o=Ur+s.width/2,r=window.innerWidth-Ur-s.width/2,i=n.left+n.width/2,a=s.width?Math.min(Math.max(i,o),r):i,l=n.bottom+xd,c=n.top-xd-s.height>=Ur;return l+s.height+Ur>window.innerHeight&&c&&(l=n.top-xd-s.height),{left:`${a}px`,top:`${Math.max(Ur,l)}px`}},yt=({text:t="",widthClass:e="w-64",tooltipClassName:n="",triggerClassName:s="",children:o=null,disabled:r=!1,delay:i=0})=>{let a=ee(null),l=ee(null),c=ee(null),d=ee(!1),[u,p]=y(!1),[f,g]=y(null);L(()=>{if(!u||r||!t)return;let b=()=>{let x=fS(a.current,l.current);x&&g(x)};return b(),window.addEventListener("resize",b),window.addEventListener("scroll",b,!0),()=>{window.removeEventListener("resize",b),window.removeEventListener("scroll",b,!0)}},[u,r,t]);let m=()=>{if(r||!t)return;let b=Date.now()-Gg<pS,x=()=>a.current?.matches?.(":hover")||qg(a.current);if(i>0&&!b)clearTimeout(c.current),c.current=setTimeout(()=>{x()&&p(!0)},i);else{if(!x())return;p(!0)}},h=()=>{clearTimeout(c.current),u&&(Gg=Date.now()),p(!1)};return Kg`
    <span
      ref=${a}
      class=${s||"inline-flex"}
      onPointerDown=${()=>{d.current=!0,clearTimeout(c.current)}}
      onPointerUp=${()=>{d.current=!1}}
      onPointerCancel=${()=>{d.current=!1}}
      onMouseEnter=${m}
      onMouseLeave=${h}
      onFocusIn=${()=>{d.current||qg(a.current)&&m()}}
      onFocusOut=${b=>{d.current=!1,!b.currentTarget.contains(b.relatedTarget)&&h()}}
    >
      ${o}
      ${u&&!r&&t&&typeof document<"u"?Do(Kg`
              <span
                ref=${l}
                role="tooltip"
                class=${`pointer-events-none fixed left-0 top-0 z-[80] -translate-x-1/2 rounded-md border border-border bg-modal px-2 py-1 text-[11px] text-body shadow-lg ${e} ${n}`.trim()}
                style=${f||{visibility:"hidden"}}
              >
                ${t}
              </span>
            `,document.body):null}
    </span>
  `};var yd=P.bind(T),Xe=({options:t=[],value:e,onChange:n=()=>{},className:s="",size:o="sm",fullWidth:r=!1})=>yd`
  <div
    class=${`ac-segmented-control ${o==="lg"?"ac-segmented-control-lg":""} ${r?"ac-segmented-control-full":""} ${s}`.trim()}
  >
    ${t.map(i=>{let a=yd`
          <button
            class=${`ac-segmented-control-button ${i.value===e?"active":""}`}
            onclick=${()=>n(i.value)}
          >
            ${i.label}
          </button>
        `;return i.title?yd`<${yt} text=${i.title} delay=${1e3} widthClass="w-auto max-w-64 whitespace-normal">${a}</${yt}>`:a})}
  </div>
`;var Me=P.bind(T),Ca=({className:t=""})=>Me`
  <svg
    class=${t}
    width="12"
    height="12"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M5 7.5L10 12.5L15 7.5"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
`,nt=({className:t=""})=>Me`
  <svg
    class=${t}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M4 4L12 12M12 4L4 12"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
`,No=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z" />
  </svg>
`;var Jg=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M13 19H19V9.97815L12 4.53371L5 9.97815V19H11V13H13V19ZM21 20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.48907C3 9.18048 3.14247 8.88917 3.38606 8.69972L11.3861 2.47749C11.7472 2.19663 12.2528 2.19663 12.6139 2.47749L20.6139 8.69972C20.8575 8.88917 21 9.18048 21 9.48907V20Z"
    />
  </svg>
`,Zg=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M4 5V19H20V7H11.5858L9.58579 5H4ZM12.4142 5H21C21.5523 5 22 5.44772 22 6V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H10.4142L12.4142 5Z"
    />
  </svg>
`,Yg=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M13.5 2C13.5 2.44425 13.3069 2.84339 13 3.11805V5H18C19.6569 5 21 6.34315 21 8V18C21 19.6569 19.6569 21 18 21H6C4.34315 21 3 19.6569 3 18V8C3 6.34315 4.34315 5 6 5H11V3.11805C10.6931 2.84339 10.5 2.44425 10.5 2C10.5 1.17157 11.1716 0.5 12 0.5C12.8284 0.5 13.5 1.17157 13.5 2ZM6 7C5.44772 7 5 7.44772 5 8V18C5 18.5523 5.44772 19 6 19H18C18.5523 19 19 18.5523 19 18V8C19 7.44772 18.5523 7 18 7H13H11H6ZM2 10H0V16H2V10ZM22 10H24V16H22V10ZM9 14.5C9.82843 14.5 10.5 13.8284 10.5 13C10.5 12.1716 9.82843 11.5 9 11.5C8.17157 11.5 7.5 12.1716 7.5 13C7.5 13.8284 8.17157 14.5 9 14.5ZM15 14.5C15.8284 14.5 16.5 13.8284 16.5 13C16.5 12.1716 15.8284 11.5 15 11.5C14.1716 11.5 13.5 12.1716 13.5 13C13.5 13.8284 14.1716 14.5 15 14.5Z"
    />
  </svg>
`,Xg=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3ZM7 15.5V11.5L9 13.5L11 11.5V15.5H13V8.5H11L9 10.5L7 8.5H5V15.5H7ZM18 12.5V8.5H16V12.5H14L17 15.5L20 12.5H18Z"
    />
  </svg>
`,Qg=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M21 8V20.9932C21 21.5501 20.5552 22 20.0066 22H3.9934C3.44495 22 3 21.556 3 21.0082V2.9918C3 2.45531 3.4487 2 4.00221 2H14.9968L21 8ZM19 9H14V4H5V20H19V9Z"
    />
  </svg>
`,eb=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M6 3C4.34315 3 3 4.34315 3 6V18C3 19.6569 4.34315 21 6 21H18C19.6569 21 21 19.6569 21 18V6C21 4.34315 19.6569 3 18 3H6ZM13.3344 16.055C14.0531 16.6343 14.7717 16.9203 15.4904 16.913C15.9304 16.913 16.2677 16.8323 16.5024 16.671C16.7297 16.517 16.8434 16.297 16.8434 16.011C16.8434 15.7177 16.7297 15.4683 16.5024 15.263C16.2677 15.0577 15.8241 14.8523 15.1714 14.647C14.3867 14.4197 13.7817 14.1263 13.3564 13.767C12.9384 13.4077 12.7257 12.9053 12.7184 12.26C12.7184 11.6513 12.9824 11.1417 13.5104 10.731C14.0237 10.3203 14.6801 10.115 15.4794 10.115C16.5941 10.115 17.4887 10.3863 18.1634 10.929L17.3934 12.128C17.1221 11.9153 16.8104 11.7613 16.4584 11.666C16.1064 11.556 15.7911 11.501 15.5124 11.501C15.1311 11.501 14.8267 11.5707 14.5994 11.71C14.3721 11.8493 14.2584 12.0327 14.2584 12.26C14.2584 12.5093 14.3977 12.722 14.6764 12.898C14.9551 13.0667 15.4317 13.2537 16.1064 13.459C16.9204 13.701 17.4997 14.0237 17.8444 14.427C18.1891 14.8303 18.3614 15.3437 18.3614 15.967C18.3614 16.605 18.1157 17.155 17.6244 17.617C17.1404 18.0717 16.4364 18.31 15.5124 18.332C14.3024 18.332 13.2904 17.969 12.4764 17.243L13.3344 16.055ZM7.80405 16.693C8.03872 16.8397 8.32105 16.913 8.65105 16.913C8.99572 16.913 9.28172 16.814 9.50905 16.616C9.73639 16.4107 9.85005 16.055 9.85005 15.549V10.247H11.3351V15.835C11.3131 16.7003 11.0637 17.3237 10.5871 17.705C10.3157 17.9323 10.0187 18.0937 9.69605 18.189C9.37339 18.2843 9.06172 18.332 8.76105 18.332C8.21105 18.332 7.72339 18.2367 7.29805 18.046C6.84339 17.8407 6.46205 17.4777 6.15405 16.957L7.18805 16.11C7.37872 16.3667 7.58405 16.561 7.80405 16.693Z"
    />
  </svg>
`,tb=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M5 11.1005L7 9.1005L12.5 14.6005L16 11.1005L19 14.1005V5H5V11.1005ZM4 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3ZM15.5 10C14.6716 10 14 9.32843 14 8.5C14 7.67157 14.6716 7 15.5 7C16.3284 7 17 7.67157 17 8.5C17 9.32843 16.3284 10 15.5 10Z"
    />
  </svg>
`,nb=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M20.7134 8.12811L20.4668 8.69379C20.2864 9.10792 19.7136 9.10792 19.5331 8.69379L19.2866 8.12811C18.8471 7.11947 18.0555 6.31641 17.0677 5.87708L16.308 5.53922C15.8973 5.35653 15.8973 4.75881 16.308 4.57612L17.0252 4.25714C18.0384 3.80651 18.8442 2.97373 19.2761 1.93083L19.5293 1.31953C19.7058 0.893489 20.2942 0.893489 20.4706 1.31953L20.7238 1.93083C21.1558 2.97373 21.9616 3.80651 22.9748 4.25714L23.6919 4.57612C24.1027 4.75881 24.1027 5.35653 23.6919 5.53922L22.9323 5.87708C21.9445 6.31641 21.1529 7.11947 20.7134 8.12811ZM2.9918 3H14V5H4V19L14 9L20 15V11H22V20.0066C22 20.5552 21.5447 21 21.0082 21H2.9918C2.44405 21 2 20.5551 2 20.0066V3.9934C2 3.44476 2.45531 3 2.9918 3ZM20 17.8284L14 11.8284L6.82843 19H20V17.8284ZM8 11C6.89543 11 6 10.1046 6 9C6 7.89543 6.89543 7 8 7C9.10457 7 10 7.89543 10 9C10 10.1046 9.10457 11 8 11Z"
    />
  </svg>
`,_a=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M7 6C7 6.23676 7.04072 6.46184 7.11469 6.66999C7.22686 6.98559 7.17357 7.33638 6.97276 7.60444C6.77194 7.8725 6.45026 8.02222 6.11585 8.00327C6.0776 8.0011 6.03898 8 6 8C4.89543 8 4 8.89543 4 10C4 10.5129 4.19174 10.9786 4.50903 11.3331C4.84885 11.7128 4.84885 12.2872 4.50903 12.6669C4.19174 13.0214 4 13.4871 4 14C4 14.8842 4.57447 15.6369 5.37327 15.9001C5.84924 16.057 6.1356 16.5419 6.04308 17.0345C6.01489 17.1846 6 17.3401 6 17.5C6 18.8807 7.11929 20 8.5 20C9.75862 20 10.8015 19.069 10.9746 17.8583C10.9806 17.8165 10.9891 17.7756 11 17.7358V6C11 4.89543 10.1046 4 9 4C7.89543 4 7 4.89543 7 6ZM13 17.7358C13.0109 17.7756 13.0194 17.8165 13.0254 17.8583C13.1985 19.069 14.2414 20 15.5 20C16.8807 20 18 18.8807 18 17.5C18 17.3401 17.9851 17.1846 17.9569 17.0345C17.8644 16.5419 18.1508 16.057 18.6267 15.9001C19.4255 15.6369 20 14.8842 20 14C20 13.4871 19.8083 13.0214 19.491 12.6669C19.1511 12.2872 19.1511 11.7128 19.491 11.3331C19.8083 10.9786 20 10.5129 20 10C20 8.89543 19.1046 8 18 8C17.961 8 17.9224 8.0011 17.8841 8.00327C17.5497 8.02222 17.2281 7.8725 17.0272 7.60444C16.8264 7.33638 16.7731 6.98559 16.8853 6.66999C16.9593 6.46184 17 6.23676 17 6C17 4.89543 16.1046 4 15 4C13.8954 4 13 4.89543 13 6V17.7358ZM9 2C10.1947 2 11.2671 2.52376 12 3.35418C12.7329 2.52376 13.8053 2 15 2C17.2091 2 19 3.79086 19 6C19 6.04198 18.9994 6.08382 18.9981 6.12552C20.7243 6.56889 22 8.13546 22 10C22 10.728 21.8049 11.4116 21.4646 12C21.8049 12.5884 22 13.272 22 14C22 15.4817 21.1949 16.7734 19.9999 17.4646L20 17.5C20 19.9853 17.9853 22 15.5 22C14.0859 22 12.8248 21.3481 12 20.3285C11.1752 21.3481 9.91405 22 8.5 22C6.01472 22 4 19.9853 4 17.5L4.00014 17.4646C2.80512 16.7734 2 15.4817 2 14C2 13.272 2.19513 12.5884 2.53536 12C2.19513 11.4116 2 10.728 2 10C2 8.13546 3.27573 6.56889 5.00194 6.12552C5.00065 6.08382 5 6.04198 5 6C5 3.79086 6.79086 2 9 2Z"
    />
  </svg>
`,sb=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M14.5 5H6C4.89543 5 4 5.89543 4 7V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V14.5H22V17C22 19.2091 20.2091 21 18 21H6C3.79086 21 2 19.2091 2 17V7C2 4.79086 3.79086 3 6 3H14.5V5ZM14 11H11V17H9V11H6V9H14V11ZM20.6572 1.34277C22.1049 2.79049 23 4.79086 23 7C23 9.20914 22.1049 11.2095 20.6572 12.6572L19.2422 11.2422C20.328 10.1564 21 8.65685 21 7C21 5.34315 20.328 3.8436 19.2422 2.75781L20.6572 1.34277ZM17.8281 4.17188C18.552 4.89573 19 5.89543 19 7C19 8.10457 18.552 9.10427 17.8281 9.82812L16.4141 8.41406C16.776 8.05213 17 7.55228 17 7C17 6.44772 16.776 5.94787 16.4141 5.58594L17.8281 4.17188Z"
    />
  </svg>
`,ob=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22H2L4.92893 19.0711C3.11929 17.2614 2 14.7614 2 12ZM6.82843 20H12C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 14.1524 4.85124 16.1649 6.34315 17.6569L7.75736 19.0711L6.82843 20ZM11 6H13V18H11V6ZM7 9H9V15H7V9ZM15 9H17V15H15V9Z"
    />
  </svg>
`,rb=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M16 8V10H13V14.5C13 15.8807 11.8807 17 10.5 17C9.11929 17 8 15.8807 8 14.5C8 13.1193 9.11929 12 10.5 12C10.6712 12 10.8384 12.0172 11 12.05V8H15V4H5V20H19V8H16ZM3 2.9918C3 2.44405 3.44749 2 3.9985 2H16L20.9997 7L21 20.9925C21 21.5489 20.5551 22 20.0066 22H3.9934C3.44476 22 3 21.5447 3 21.0082V2.9918Z"
    />
  </svg>
`,ib=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M10.9999 12L3.92886 19.0711L2.51465 17.6569L8.1715 12L2.51465 6.34317L3.92886 4.92896L10.9999 12ZM10.9999 19H20.9999V21H10.9999V19Z"
    />
  </svg>
`,Ma=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M4 18V14.3C4 13.4716 3.32843 12.8 2.5 12.8H2V11.2H2.5C3.32843 11.2 4 10.5284 4 9.7V6C4 4.34315 5.34315 3 7 3H8V5H7C6.44772 5 6 5.44772 6 6V10.1C6 10.9858 5.42408 11.7372 4.62623 12C5.42408 12.2628 6 13.0142 6 13.9V18C6 18.5523 6.44772 19 7 19H8V21H7C5.34315 21 4 19.6569 4 18ZM20 14.3V18C20 19.6569 18.6569 21 17 21H16V19H17C17.5523 19 18 18.5523 18 18V13.9C18 13.0142 18.5759 12.2628 19.3738 12C18.5759 11.7372 18 10.9858 18 10.1V6C18 5.44772 17.5523 5 17 5H16V3H17C18.6569 3 20 4.34315 20 6V9.7C20 10.5284 20.6716 11.2 21.5 11.2H22V12.8H21.5C20.6716 12.8 20 13.4716 20 14.3Z"
    />
  </svg>
`,ab=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M15 4H5V20H19V8H15V4ZM3 2.9918C3 2.44405 3.44749 2 3.9985 2H16L20.9997 7L21 20.9925C21 21.5489 20.5551 22 20.0066 22H3.9934C3.44476 22 3 21.5447 3 21.0082V2.9918ZM17.6569 12L14.1213 15.5355L12.7071 14.1213L14.8284 12L12.7071 9.87868L14.1213 8.46447L17.6569 12ZM6.34315 12L9.87868 8.46447L11.2929 9.87868L9.17157 12L11.2929 14.1213L9.87868 15.5355L6.34315 12Z"
    />
  </svg>
`,lb=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M5 12.5C5 12.8134 5.46101 13.3584 6.53047 13.8931C7.91405 14.5849 9.87677 15 12 15C14.1232 15 16.0859 14.5849 17.4695 13.8931C18.539 13.3584 19 12.8134 19 12.5V10.3287C17.35 11.3482 14.8273 12 12 12C9.17273 12 6.64996 11.3482 5 10.3287V12.5ZM19 15.3287C17.35 16.3482 14.8273 17 12 17C9.17273 17 6.64996 16.3482 5 15.3287V17.5C5 17.8134 5.46101 18.3584 6.53047 18.8931C7.91405 19.5849 9.87677 20 12 20C14.1232 20 16.0859 19.5849 17.4695 18.8931C18.539 18.3584 19 17.8134 19 17.5V15.3287ZM3 17.5V7.5C3 5.01472 7.02944 3 12 3C16.9706 3 21 5.01472 21 7.5V17.5C21 19.9853 16.9706 22 12 22C7.02944 22 3 19.9853 3 17.5ZM12 10C14.1232 10 16.0859 9.58492 17.4695 8.89313C18.539 8.3584 19 7.81342 19 7.5C19 7.18658 18.539 6.6416 17.4695 6.10687C16.0859 5.41508 14.1232 5 12 5C9.87677 5 7.91405 5.41508 6.53047 6.10687C5.46101 6.6416 5 7.18658 5 7.5C5 7.81342 5.46101 8.3584 6.53047 8.89313C7.91405 9.58492 9.87677 10 12 10Z"
    />
  </svg>
`,cb=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M7.78428 14L8.2047 10H4V8H8.41491L8.94043 3H10.9514L10.4259 8H14.4149L14.9404 3H16.9514L16.4259 8H20V10H16.2157L15.7953 14H20V16H15.5851L15.0596 21H13.0486L13.5741 16H9.58509L9.05957 21H7.04855L7.57407 16H4V14H7.78428ZM9.7953 14H13.7843L14.2047 10H10.2157L9.7953 14Z"
    />
  </svg>
`,db=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M3 12H5V21H3V12ZM19 8H21V21H19V8ZM11 2H13V21H11V2Z" />
  </svg>
`,ub=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M6.11629 20.0868L7.1308 18.348C5.2271 16.8856 4 14.5861 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 14.5861 18.7729 16.8856 16.8692 18.348L17.8837 20.0868C20.3786 18.2684 22 15.3236 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 15.3236 3.62137 18.2684 6.11629 20.0868ZM8.14965 16.6018C6.83562 15.5012 6 13.8482 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 13.8482 17.1644 15.5012 15.8503 16.6018L14.8203 14.8365C15.549 14.112 16 13.1087 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 13.1087 8.45105 14.112 9.17965 14.8365L8.14965 16.6018ZM11 13H13V22H11V13Z" />
  </svg>
`,pb=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M7.10508 15.2101C8.21506 15.6501 9 16.7334 9 18C9 19.6569 7.65685 21 6 21C4.34315 21 3 19.6569 3 18C3 16.6938 3.83481 15.5825 5 15.1707V8.82929C3.83481 8.41746 3 7.30622 3 6C3 4.34315 4.34315 3 6 3C7.65685 3 9 4.34315 9 6C9 7.30622 8.16519 8.41746 7 8.82929V11.9996C7.83566 11.3719 8.87439 11 10 11H14C15.3835 11 16.5482 10.0635 16.8949 8.78991C15.7849 8.34988 15 7.26661 15 6C15 4.34315 16.3431 3 18 3C19.6569 3 21 4.34315 21 6C21 7.3332 20.1303 8.46329 18.9274 8.85392C18.5222 11.2085 16.4703 13 14 13H10C8.61653 13 7.45179 13.9365 7.10508 15.2101ZM6 17C5.44772 17 5 17.4477 5 18C5 18.5523 5.44772 19 6 19C6.55228 19 7 18.5523 7 18C7 17.4477 6.55228 17 6 17ZM6 5C5.44772 5 5 5.44772 5 6C5 6.55228 5.44772 7 6 7C6.55228 7 7 6.55228 7 6C7 5.44772 6.55228 5 6 5ZM18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z"
    />
  </svg>
`,vd=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M12.001 2C6.47598 2 2.00098 6.475 2.00098 12C2.00098 16.425 4.86348 20.1625 8.83848 21.4875C9.33848 21.575 9.52598 21.275 9.52598 21.0125C9.52598 20.775 9.51348 19.9875 9.51348 19.15C7.00098 19.6125 6.35098 18.5375 6.15098 17.975C6.03848 17.6875 5.55098 16.8 5.12598 16.5625C4.77598 16.375 4.27598 15.9125 5.11348 15.9C5.90098 15.8875 6.46348 16.625 6.65098 16.925C7.55098 18.4375 8.98848 18.0125 9.56348 17.75C9.65098 17.1 9.91348 16.6625 10.201 16.4125C7.97598 16.1625 5.65098 15.3 5.65098 11.475C5.65098 10.3875 6.03848 9.4875 6.67598 8.7875C6.57598 8.5375 6.22598 7.5125 6.77598 6.1375C6.77598 6.1375 7.61348 5.875 9.52598 7.1625C10.326 6.9375 11.176 6.825 12.026 6.825C12.876 6.825 13.726 6.9375 14.526 7.1625C16.4385 5.8625 17.276 6.1375 17.276 6.1375C17.826 7.5125 17.476 8.5375 17.376 8.7875C18.0135 9.4875 18.401 10.375 18.401 11.475C18.401 15.3125 16.0635 16.1625 13.8385 16.4125C14.201 16.725 14.5135 17.325 14.5135 18.2625C14.5135 19.6 14.501 20.675 14.501 21.0125C14.501 21.275 14.6885 21.5875 15.1885 21.4875C19.259 20.1133 21.9999 16.2963 22.001 12C22.001 6.475 17.526 2 12.001 2Z"
    />
  </svg>
`,fb=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M18 21V13H6V21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H17L21 7V20C21 20.5523 20.5523 21 20 21H18ZM16 21H8V15H16V21Z"
    />
  </svg>
`,Oo=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M19 10H20C20.5523 10 21 10.4477 21 11V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V11C3 10.4477 3.44772 10 4 10H5V9C5 5.13401 8.13401 2 12 2C15.866 2 19 5.13401 19 9V10ZM5 12V20H19V12H5ZM11 14H13V18H11V14ZM17 10V9C17 6.23858 14.7614 4 12 4C9.23858 4 7 6.23858 7 9V10H17Z"
    />
  </svg>
`,Aa=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z"
    />
  </svg>
`,Kr=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M15 4H5V20H19V8H15V4ZM3 2.9918C3 2.44405 3.44749 2 3.9985 2H16L20.9997 7L21 20.9925C21 21.5489 20.5551 22 20.0066 22H3.9934C3.44476 22 3 21.5447 3 21.0082V2.9918ZM11 11V8H13V11H16V13H13V16H11V13H8V11H11Z"
    />
  </svg>
`,Gr=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M12.4142 5H21C21.5523 5 22 5.44772 22 6V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H10.4142L12.4142 5ZM4 5V19H20V7H11.5858L9.58579 5H4ZM11 12V9H13V12H16V14H13V17H11V14H8V12H11Z"
    />
  </svg>
`,hb=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M3 19H21V21H3V19ZM13 13.1716L19.0711 7.1005L20.4853 8.51472L12 17L3.51472 8.51472L4.92893 7.1005L11 13.1716V2H13V13.1716Z"
    />
  </svg>
`,Us=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M6.9998 6V3C6.9998 2.44772 7.44752 2 7.9998 2H19.9998C20.5521 2 20.9998 2.44772 20.9998 3V17C20.9998 17.5523 20.5521 18 19.9998 18H16.9998V20.9991C16.9998 21.5519 16.5499 22 15.993 22H4.00666C3.45059 22 3 21.5554 3 20.9991L3.0026 7.00087C3.0027 6.44811 3.45264 6 4.00942 6H6.9998ZM5.00242 8L5.00019 20H14.9998V8H5.00242ZM8.9998 6H16.9998V16H18.9998V4H8.9998V6Z"
    />
  </svg>
`,mb=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M18.5374 19.5674C16.7844 21.0831 14.4993 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 14.1361 21.3302 16.1158 20.1892 17.7406L17 12H20C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C14.1502 20 16.1022 19.1517 17.5398 17.7716L18.5374 19.5674Z"
    />
  </svg>
`,gb=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z"
    />
  </svg>
`,Ta=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12.0001 22.0001C7.02956 22.0001 3.00012 17.9707 3.00012 13.0001C3.00012 8.02956 7.02956 4.00012 12.0001 4.00012C16.9707 4.00012 21.0001 8.02956 21.0001 13.0001C21.0001 17.9707 16.9707 22.0001 12.0001 22.0001ZM12.0001 20.0001C15.8661 20.0001 19.0001 16.8661 19.0001 13.0001C19.0001 9.13412 15.8661 6.00012 12.0001 6.00012C8.13412 6.00012 5.00012 9.13412 5.00012 13.0001C5.00012 16.8661 8.13412 20.0001 12.0001 20.0001ZM13.0001 13.0001H16.0001V15.0001H11.0001V8.00012H13.0001V13.0001ZM1.74707 6.2826L5.2826 2.74707L6.69682 4.16128L3.16128 7.69682L1.74707 6.2826ZM18.7176 2.74707L22.2532 6.2826L20.839 7.69682L17.3034 4.16128L18.7176 2.74707Z" />
  </svg>
`;var bb=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M9 7.53861L15 21.5386L18.6594 13H23V11H17.3406L15 16.4614L9 2.46143L5.3406 11H1V13H6.6594L9 7.53861Z" />
  </svg>
`,xb=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12.0003 3C17.3924 3 21.8784 6.87976 22.8189 12C21.8784 17.1202 17.3924 21 12.0003 21C6.60812 21 2.12215 17.1202 1.18164 12C2.12215 6.87976 6.60812 3 12.0003 3ZM12.0003 19C16.2359 19 19.8603 16.052 20.7777 12C19.8603 7.94803 16.2359 5 12.0003 5C7.7646 5 4.14022 7.94803 3.22278 12C4.14022 16.052 7.7646 19 12.0003 19ZM12.0003 16.5C9.51498 16.5 7.50026 14.4853 7.50026 12C7.50026 9.51472 9.51498 7.5 12.0003 7.5C14.4855 7.5 16.5003 9.51472 16.5003 12C16.5003 14.4853 14.4855 16.5 12.0003 16.5ZM12.0003 14.5C13.381 14.5 14.5003 13.3807 14.5003 12C14.5003 10.6193 13.381 9.5 12.0003 9.5C10.6196 9.5 9.50026 10.6193 9.50026 12C9.50026 13.3807 10.6196 14.5 12.0003 14.5Z" />
  </svg>
`;var Pa=({className:t=""})=>Me`
  <svg
    class=${t}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M4 16H20V5H4V16ZM13 18V20H17V22H7V20H11V18H2.9918C2.44405 18 2 17.5511 2 16.9925V4.00748C2 3.45107 2.45531 3 2.9918 3H21.0082C21.556 3 22 3.44892 22 4.00748V16.9925C22 17.5489 21.5447 18 21.0082 18H13Z" />
  </svg>
`;var Bo=P.bind(T),hS=({className:t=""})=>Bo`
  <svg class=${t} width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <circle cx="8" cy="3" r="1.5" />
    <circle cx="8" cy="8" r="1.5" />
    <circle cx="8" cy="13" r="1.5" />
  </svg>
`,pt=({open:t=!1,onToggle:e=()=>{},onClose:n=()=>{},ariaLabel:s="Open menu",title:o="",menuRef:r=null,renderTrigger:i=null,triggerDisabled:a=!1,children:l=null})=>{let c=ee(null),d=u=>{if(c.current=u,typeof r=="function"){r(u);return}r&&typeof r=="object"&&(r.current=u)};return L(()=>{if(!t)return;let u=p=>{let f=c.current;f&&(f.contains(p.target)||n(p))};return window.addEventListener("click",u),()=>window.removeEventListener("click",u)},[t,n]),Bo`
  <div class="brand-menu" ref=${d}>
    ${typeof i=="function"?i({open:t,onToggle:u=>{u.stopPropagation(),e(u)},ariaLabel:s,title:o||s}):Bo`
          <button
            type="button"
            class="brand-menu-trigger"
            aria-label=${s}
            aria-expanded=${t?"true":"false"}
            title=${o||s}
            disabled=${a}
            onclick=${u=>{u.stopPropagation(),e(u)}}
          >
            <${hS} />
          </button>
        `}
    ${t?Bo`
          <div class="brand-dropdown" onclick=${u=>u.stopPropagation()}>
            ${l}
          </div>
        `:null}
  </div>
`},We=({children:t=null,onClick:e=()=>{},className:n="",iconSrc:s="",disabled:o=!1})=>Bo`
  <button
    type="button"
    class=${`brand-dropdown-item ${n} ${o?"opacity-50 cursor-not-allowed":""}`.trim()}
    disabled=${o}
    onclick=${r=>{r.stopPropagation(),!o&&e(r)}}
  >
    ${s?Bo`
          <span class="flex w-full items-center gap-2 leading-none">
            <img
              src=${s}
              alt=""
              class="block w-4 h-4 rounded-sm"
              aria-hidden="true"
            />
            <span>${t}</span>
          </span>
        `:t}
  </button>
`;var $d=P.bind(T),Ra=({open:t=!1,onClose:e=()=>{},onToggle:n=()=>{},triggerDisabled:s=!1,channelIds:o=[],getChannelMeta:r=()=>({label:"Channel",iconSrc:""}),isChannelDisabled:i=()=>!1,onSelectChannel:a=()=>{}})=>$d`
  <${pt}
    open=${t}
    ariaLabel="Add channel"
    title="Add channel"
    onClose=${e}
    onToggle=${n}
    renderTrigger=${({onToggle:l,ariaLabel:c,title:d})=>$d`
      <${Z}
        onClick=${l}
        disabled=${s}
        loading=${!1}
        loadingMode="inline"
        tone="subtle"
        size="sm"
        idleLabel="Add channel"
        loadingLabel="Opening..."
        idleIcon=${No}
        idleIconClassName="h-3.5 w-3.5"
        iconOnly=${!0}
        title=${d}
        ariaLabel=${c}
      />
    `}
  >
    ${o.map(l=>{let c=r(l),d=!!i(l);return $d`
        <${We}
          key=${l}
          iconSrc=${c.iconSrc}
          disabled=${d}
          onClick=${()=>a(l)}
        >
          ${c.label}
        </${We}>
      `})}
  </${pt}>
`;var wd=P.bind(T),Ks=({status:t="configured",ownerAgentName:e="",showAgentBadge:n=!1,channelId:s="",pairedCount:o=0})=>String(t||"").trim()!=="paired"?wd`<${ae} tone="warning">Awaiting pairing</${ae}>`:n&&e?wd`
      <${ae} tone="neutral">
        <span class="inline-flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-green-400"></span>
          ${e}
        </span>
      </${ae}>
    `:wd`
    <${ae} tone="success">
      ${s==="telegram"||Number(o)<=1?"Paired":`Paired (${Number(o)})`}
    </${ae}>
  `;var mS=P.bind(T),st=({visible:t=!1,title:e="Confirm action",message:n="Are you sure you want to continue?",details:s=null,confirmLabel:o="Confirm",confirmLoadingLabel:r="Working...",cancelLabel:i="Cancel",onConfirm:a,onCancel:l,confirmTone:c="primary",confirmLoading:d=!1,confirmDisabled:u=!1})=>(L(()=>{if(!t)return;let f=g=>{g.key==="Escape"&&l?.()};return window.addEventListener("keydown",f),()=>window.removeEventListener("keydown",f)},[t,l]),t?mS`
    <div
      class="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-50"
      onclick=${f=>{f.target===f.currentTarget&&l?.()}}
    >
      <div class="bg-modal border border-border rounded-xl p-5 max-w-md w-full space-y-3">
        <h2 class="text-base font-semibold">${e}</h2>
        <p class="text-sm text-fg-muted">${n}</p>
        ${s}
        <div class="pt-1 flex items-center justify-end gap-2">
          <${Z}
            onClick=${l}
            disabled=${d}
            tone="secondary"
            size="md"
            idleLabel=${i}
            className="px-4 py-2 rounded-lg text-sm"
          />
          <${Z}
            onClick=${a}
            disabled=${u}
            loading=${d}
            tone=${c==="warning"?"warning":"primary"}
            size="md"
            idleLabel=${o}
            loadingLabel=${r}
            className="px-4 py-2 rounded-lg text-sm"
          />
        </div>
      </div>
    </div>
  `:null);var kd=new Map,Gs=new Map,yb=()=>Date.now(),gS=(t,e)=>t?yb()-Number(t.fetchedAt||0)<Number(e||0):!1,ms=(t="")=>{let e=String(t||"");return e?kd.get(e)?.data??null:null},La=(t="",e=null)=>{let n=String(t||"");return n&&kd.set(n,{data:e,fetchedAt:yb()}),e};var vb=async(t,e,{maxAgeMs:n=15e3,force:s=!1,staleWhileRevalidate:o=!0,onRevalidate:r=null}={})=>{let i=String(t||"");if(!i||typeof e!="function")return e();let a=kd.get(i);if(!s&&gS(a,n))return a.data;if(!s&&o&&a){if(!Gs.has(i)){let c=Promise.resolve().then(()=>e()).then(d=>(La(i,d),typeof r=="function"&&r(d),d)).finally(()=>{Gs.delete(i)});Gs.set(i,c)}return a.data}if(Gs.has(i))return Gs.get(i);let l=Promise.resolve().then(()=>e()).then(c=>(La(i,c),c)).finally(()=>{Gs.delete(i)});return Gs.set(i,l),l};var ct=(t,e,{enabled:n=!0,maxAgeMs:s=15e3,staleWhileRevalidate:o=!0}={})=>{let r=F(()=>String(t||""),[t]),i=F(()=>ms(r),[r]),[a,l]=y(i),[c,d]=y(i===null),[u,p]=y(null);L(()=>{l(ms(r))},[r]);let f=q(async({force:g=!1}={})=>{if(!n)return ms(r);ms(r)===null&&d(!0);try{let m=await vb(r,e,{maxAgeMs:s,force:g,staleWhileRevalidate:o,onRevalidate:h=>{l(h),p(null)}});return l(m),p(null),m}catch(m){throw p(m),m}finally{d(!1)}},[n,e,s,r,o]);return L(()=>{n&&f().catch(()=>{})},[n,f]),{data:a,error:u,loading:c,refresh:f}};var qs=({channelId:t,account:e={},providerLabel:n=""})=>{let s=t?t.charAt(0).toUpperCase()+t.slice(1):"Channel",o=String(n||"").trim()||s,r=String(e?.name||"").trim();if(r)return r;let i=String(e?.id||"").trim();return!i||i==="default"?o:`${o} ${i}`},gs=({accountId:t,boundAgentId:e})=>String(t||"").trim()==="default"&&!String(e||"").trim();var Ea=async({payload:t={},onPhase:e=()=>{}})=>{if(e("Loading..."),typeof window?.EventSource!="function")return jm(t);let n=await zm(t),s=String(n?.operationId||"").trim();if(!s)throw new Error("Could not start channel creation operation");return new Promise((o,r)=>{let i=!1,a="",l=0,c=null,d=null,u={restarting:1200},p=()=>{d&&(clearTimeout(d),d=null)},f=({phase:h="",label:b=""}={})=>{let x=String(h||"").trim(),v=String(b||"").trim();if(!v)return;let w=Number(u[a]||0),$=l>0?Date.now()-l:0;if(w>0&&x&&x!==a&&$<w){c={phase:x,label:v},p(),d=setTimeout(()=>{d=null;let S=c;c=null,S&&f(S)},w-$);return}p(),c=null,e(v),a=x,l=Date.now()},g=()=>{p(),m()},m=Um({operationId:s,onMessage:h=>{let b=String(h?.event||"").trim();if(b==="phase"){f({phase:String(h?.data?.phase||"").trim(),label:String(h?.data?.label||"").trim()});return}if(b==="done"){if(i)return;i=!0,g(),o(h?.data||{});return}if(b==="error"){if(i)return;i=!0,g(),r(new Error(String(h?.data?.error||"Could not create channel")))}},onError:()=>{i||(i=!0,g(),r(new Error("Channel operation stream disconnected")))}})})};var bS=new Set(["discord","slack"]),xS=({configuredChannelMap:t,provider:e})=>{let n=t instanceof Map?t.get(String(e||"").trim()):null;return Array.isArray(n?.accounts)&&n.accounts.length>0},yS=(t="")=>bS.has(String(t||"").trim()),Ia=({configuredChannelMap:t=new Map,provider:e=""}={})=>yS(e)?xS({configuredChannelMap:t,provider:e}):!1;var vS=P.bind(T),De=({visible:t=!1,onClose:e=()=>{},closeOnOverlayClick:n=!0,closeOnEscape:s=!0,panelClassName:o="bg-modal border border-border rounded-xl p-5 max-w-md w-full space-y-3",children:r=null})=>(L(()=>{if(!t||!s)return;let i=a=>{a.key==="Escape"&&e?.()};return window.addEventListener("keydown",i),()=>window.removeEventListener("keydown",i)},[t,s,e]),t?Do(vS`
      <div
        class="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-50"
        onclick=${i=>{n&&i.target===i.currentTarget&&e?.()}}
      >
        <div class=${o}>${r}</div>
      </div>
    `,document.body):null);var $b=P.bind(T),Ne=({title:t="",actions:e=null,leading:n=null})=>$b`
  <div class="flex items-center justify-between gap-3">
    <div>
      ${n||$b`<h2 class="font-semibold text-base">${t}</h2>`}
    </div>
    <div class="flex items-center gap-2">${e}</div>
  </div>
`;var Js=P.bind(T),$S={telegram:"TELEGRAM_BOT_TOKEN",discord:"DISCORD_BOT_TOKEN",slack:"SLACK_BOT_TOKEN"},wS={slack:"SLACK_APP_TOKEN"},kS=["app_mentions:read","channels:history","channels:read","chat:write","groups:history","im:history","im:read","im:write","mpim:history","reactions:read","reactions:write","users:read"],SS="https://docs.openclaw.ai/channels/slack",CS=t=>String(t||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,""),_S=({provider:t,accountId:e})=>{let n=$S[String(t||"").trim()]||"",s=String(e||"").trim();return n?!s||s==="default"?n:`${n}_${s.replace(/-/g,"_").toUpperCase()}`:""},MS=t=>/^\*+$/.test(String(t||"").trim()),qr=({visible:t=!1,loading:e=!1,createLoadingLabel:n="Creating...",agents:s=[],existingChannels:o=[],mode:r="create",account:i=null,initialAgentId:a="",initialProvider:l="",onClose:c=()=>{},onSubmit:d=async()=>{}})=>{let u=r==="edit",[p,f]=y("telegram"),[g,m]=y(""),[h,b]=y(""),[x,v]=y(""),[w,$]=y(""),[S,C]=y(""),[_,k]=y(""),[A,O]=y(!1),[D,z]=y(!1);L(()=>{if(!t)return;let K=u?String(i?.provider||"").trim()||"telegram":bs.includes(l)?l:bs[0]||"telegram",j=Lt(K).label||"Channel",X=o.find(xe=>String(xe?.channel||"").trim()===String(K||"").trim())||null,de=Array.isArray(X?.accounts)&&X.accounts.length>0,le=u?String(i?.name||"").trim()||j:de?"":j,ie=u?String(i?.ownerAgentId||"").trim()||String(a||"").trim()||String(s[0]?.id||"").trim():String(a||"").trim()||String(s[0]?.id||"").trim();f(K),m(le);let ne=u?(()=>{let xe=String(i?.token||"").trim();return MS(xe)?"":xe})():"";b(ne),v(ne),$(""),C(ie),k(""),O(u)},[t,a,l,s,o,u,i]);let E=F(()=>o.find(K=>String(K?.channel||"").trim()===String(p||"").trim())||null,[o,p]),M=F(()=>Array.isArray(E?.accounts)&&E.accounts.length>0,[E]);L(()=>{if(A)return;let K=Lt(p).label||"Channel";if(!u&&M){m("");return}m(K)},[p,M,A,u]);let R=String(p||"").trim()==="discord"||String(p||"").trim()==="slack",B=String(p||"").trim()==="slack",I=F(()=>u?String(i?.id||"").trim()||"default":R||!M?"default":CS(g),[g,M,u,i,R]),U=F(()=>_S({provider:p,accountId:I}),[p,I]),W=F(()=>Array.isArray(E?.accounts)&&E.accounts.some(K=>String(K?.id||"").trim()===String(I||"").trim()),[E,I]);L(()=>{if(!t||!u)return;let K=!1;return(async()=>{z(!0);try{let X=await Vm({provider:p,accountId:I});if(K)return;let de=String(X?.token||""),le=String(X?.appToken||"");b(de),v(de),$(le)}catch{}finally{K||z(!1)}})(),()=>{K=!0}},[t,u,p,I]);let G=!!String(p||"").trim()&&!!String(g||"").trim()&&!!String(I||"").trim()&&!!String(S||"").trim()&&(u||!!String(h||"").trim())&&(u||!B||!!String(w||"").trim())&&(u||!W)&&!D;if(!t)return null;let se=async()=>{if(!String(g||"").trim()){k("Name is required");return}if(!String(I||"").trim()){k("Channel id could not be derived from the name");return}if(!u&&!String(h||"").trim()){k("Token is required");return}if(!u&&B&&!String(w||"").trim()){k("App Token is required for Slack");return}if(!String(S||"").trim()){k("Agent is required");return}if(!u&&W){k("That channel id is already configured for this provider");return}k("");let K=String(h||"").trim(),j=K&&K!==String(x||"").trim(),X=String(w||"").trim();await d({provider:p,name:String(g||"").trim(),accountId:I,agentId:S,...j?{token:K}:{},...B&&X?{appToken:X}:{}})};return Js`
    <${De}
      visible=${t}
      onClose=${c}
      panelClassName="bg-modal border border-border rounded-xl p-6 max-w-lg w-full space-y-4"
    >
      <${Ne}
        title=${u?"Edit Channel":`Add ${Lt(p).label||"Channel"} Channel`}
        actions=${Js`
          <button
            type="button"
            onclick=${c}
            class="h-8 w-8 inline-flex items-center justify-center rounded-lg ac-btn-secondary"
            aria-label="Close modal"
          >
            <${nt} className="w-3.5 h-3.5 text-body" />
          </button>
        `}
      />

      <div class="space-y-3">
        <label class="block space-y-1">
          <span class="text-xs text-fg-muted">Name</span>
          <input
            type="text"
            value=${g}
            onInput=${K=>{O(!0),m(K.target.value)}}
            placeholder=${Lt(p).label||"Channel"}
            class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm text-body outline-none focus:border-fg-muted"
          />
        </label>

        <label class="block space-y-1">
          <span class="text-xs text-fg-muted">Id</span>
          <input
            type="text"
            value=${I}
            readOnly=${!0}
            class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm font-mono text-fg-muted outline-none"
          />
          <p class="text-xs text-fg-muted">
            ${u?"Channel id is fixed after creation.":R?`${Lt(p).label} supports one channel account and uses the default id.`:M?"Derived from the channel name.":"First account uses the default id for this provider."}
          </p>
        </label>

        <label class="block space-y-1">
          <span class="text-xs text-fg-muted">
            ${B?"Bot Token":"Token"}
          </span>
          <${Rt}
            value=${h}
            onInput=${K=>b(K.target.value)}
            placeholder=${h?"":"Paste bot token"}
            loading=${D}
            isSecret=${!0}
            inputClass="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm font-mono text-body outline-none focus:border-fg-muted"
          />
          <p class="text-xs text-fg-muted">
            Saved behind the scenes as
            <code class="font-mono text-fg-muted ml-1">${U||"CHANNEL_TOKEN"}</code>.
          </p>
        </label>

        ${B?Js`
                <label class="block space-y-1">
                  <span class="text-xs text-fg-muted"
                    >App Token (Socket Mode)</span
                  >
                  <${Rt}
                    value=${w}
                    onInput=${K=>$(K.target.value)}
                    placeholder="xapp-..."
                    isSecret=${!0}
                    inputClass="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm font-mono text-body outline-none focus:border-fg-muted"
                  />
                  <p class="text-xs text-fg-muted">
                    Saved behind the scenes as
                    <code class="font-mono text-fg-muted ml-1">
                      ${wS.slack}
                    </code>
                    .
                  </p>
                </label>
              `:null}
        ${B?Js`
                <details class="rounded-lg border border-border bg-field px-3 py-2.5">
                  <summary class="cursor-pointer text-xs text-body hover:text-body">
                    Slack-specific instructions (step-by-step)
                  </summary>
                  <div class="mt-2 space-y-2 text-xs text-fg-muted">
                    <ol class="list-decimal list-inside space-y-1.5">
                      <li>
                        In Slack app settings, turn on
                        ${" "}
                        <span class="text-body">Socket Mode</span>.
                      </li>
                      <li>
                        In
                        ${" "}
                        <span class="text-body">App Home</span>, enable
                        <code class="font-mono text-fg-muted ml-1">
                          Allow users to send Slash commands and messages from the messages tab
                        </code>.
                      </li>
                      <li>
                        In
                        ${" "}
                        <span class="text-body">Event Subscriptions</span>, toggle on
                        <code class="font-mono text-fg-muted ml-1">Subscribe to bot events</code>
                        ${" "}
                        and add
                        <code class="font-mono text-fg-muted ml-1">message.im</code>.
                      </li>
                      <li>
                        Create a Bot Token (<code class="font-mono text-fg-muted">xoxb-...</code>)
                        with scopes:
                        <code class="font-mono text-fg-muted ml-1">
                          ${kS.join(", ")}
                        </code>
                      </li>
                      <li>
                        Create an App Token (<code class="font-mono text-fg-muted">xapp-...</code>)
                        with
                        <code class="font-mono text-fg-muted ml-1">connections:write</code>.
                      </li>
                      <li>
                        Reinstall the app after changing scopes.
                      </li>
                    </ol>
                    <a
                      href=${SS}
                      target="_blank"
                      class="hover:underline"
                      style="color: var(--accent-link)"
                    >
                      Open full Slack setup guide
                    </a>
                  </div>
                </details>
              `:null}

        <label class="block space-y-1">
          <span class="text-xs text-fg-muted">Agent</span>
          <select
            value=${S}
            onInput=${K=>C(K.target.value)}
            class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm text-body outline-none focus:border-fg-muted"
          >
            ${s.map(K=>Js`
                <option key=${K.id} value=${K.id}>
                  ${K.name||K.id}
                </option>
              `)}
          </select>
        </label>

        ${!u&&W?Js`
                <p class="text-xs text-status-error-muted">
                  ${R?`${Lt(p).label} already has a configured channel account.`:`A ${Lt(p).label} account with this id already exists.`}
                </p>
              `:null}
        ${_?Js`<p class="text-xs text-status-error-muted">${_}</p>`:null}
      </div>

      <div class="flex justify-end gap-2 pt-1">
        <${Z}
          onClick=${c}
          disabled=${e}
          loading=${!1}
          tone="secondary"
          size="md"
          idleLabel="Cancel"
        />
        <${Z}
          onClick=${se}
          disabled=${e||!G}
          loading=${e}
          tone="primary"
          size="md"
          idleLabel=${u?"Save Changes":"Create Channel"}
          loadingLabel=${u?"Saving...":n}
        />
      </div>
    </${De}>
  `};var wb=P.bind(T),AS=0,Da=null,TS={success:"success",error:"error",warning:"warning",info:"info",green:"success",red:"error",yellow:"warning",blue:"info"},PS={success:"bg-status-success-bg border border-status-success-border text-status-success",error:"bg-status-error-bg border border-status-error-border text-status-error",warning:"bg-status-warning-bg border border-status-warning-border text-status-warning",info:"bg-status-info-bg border border-status-info-border text-status-info"},kb=t=>{let e=String(t||"").trim().toLowerCase();return TS[e]||"info"};function N(t,e="info"){Da&&Da({id:++AS,text:t,type:kb(e)})}function Na({className:t="fixed bottom-4 right-4 z-50 space-y-2"}){let[e,n]=y([]);return L(()=>(Da=s=>{n(o=>[...o,s]),setTimeout(()=>n(o=>o.filter(r=>r.id!==s.id)),4e3)},()=>{Da=null}),[]),e.length===0?null:Do(wb`<div class=${t} style=${{zIndex:70}}>
      ${e.map(s=>wb`
        <div key=${s.id} class="${PS[kb(s.type)]} px-4 py-2 rounded-lg text-sm">
          ${s.text}
        </div>
      `)}
    </div>`,document.body)}var en=P.bind(T),bs=["telegram","discord","slack"],RS={telegram:{label:"Telegram",iconSrc:"/assets/icons/telegram.svg"},discord:{label:"Discord",iconSrc:"/assets/icons/discord.svg"},slack:{label:"Slack",iconSrc:"/assets/icons/slack.svg"}},Lt=(t="")=>{let e=String(t||"").trim();return RS[e]||{label:e?e.charAt(0).toUpperCase()+e.slice(1):"Channel",iconSrc:""}},Sb=()=>window.dispatchEvent(new CustomEvent("alphaclaw:restart-required")),Oa=({title:t="Channels",items:e=[],loadingLabel:n="Loading...",actions:s=null,renderItem:o=null})=>en`
  <div class="bg-surface border border-border rounded-xl p-4">
    <div class="flex items-center justify-between gap-3 mb-3">
      <h2 class="card-label">${t}</h2>
      ${s?en`<div class="shrink-0">${s}</div>`:null}
    </div>
    <div class="space-y-2">
      ${e.length>0?e.map(r=>{let i=Lt(r.channel||r.id),a=!!r.clickable,l=o?o({item:r,channelMeta:i,clickable:a}):null;return l||en`
              <div
                key=${r.id||r.channel}
                class="flex justify-between items-center py-1.5 ${a?"cursor-pointer hover:bg-surface -mx-2 px-2 rounded-lg transition-colors":""}"
                onclick=${a?r.onClick:void 0}
              >
                <span
                  class="font-medium text-sm flex items-center gap-2 min-w-0"
                >
                  ${i.iconSrc?en`
                        <img
                          src=${i.iconSrc}
                          alt=""
                          class="w-4 h-4 rounded-sm"
                          aria-hidden="true"
                        />
                      `:null}
                  <span
                    class="truncate ${r.dimmedLabel?"text-fg-muted":""} ${r.labelClassName||""}"
                    >${r.label||i.label}</span
                  >
                  ${r.detailText?en`
                        <span class="text-xs text-fg-muted ml-1 shrink-0">
                          ${r.detailText}
                        </span>
                      `:null}
                  ${r.detailChevron?en`
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          class="text-fg-dim shrink-0"
                        >
                          <path
                            d="M6 3.5L10.5 8L6 12.5"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      `:null}
                </span>
                <span class="flex items-center gap-2 shrink-0">
                  ${r.trailing||null}
                </span>
              </div>
            `}):en`<div class="text-fg-muted text-sm text-center py-2">
            ${n}
          </div>`}
    </div>
  </div>
`,Cb=({channels:t=null,agents:e=[],onNavigate:n=()=>{},onRefreshStatuses:s=()=>{}})=>{let[o,r]=y(!1),[i,a]=y("Creating..."),[l,c]=y(""),[d,u]=y(null),[p,f]=y(null),{data:g,loading:m,refresh:h}=ct("/api/channels/accounts",To,{maxAgeMs:3e4}),b=Array.isArray(g?.channels)?g.channels:[],x=q(async()=>{try{await h({force:!0})}catch{}},[h]),v=F(()=>new Map(b.map(D=>[String(D?.channel||"").trim(),D])),[b]),w=F(()=>new Map(e.map(D=>[String(D?.id||"").trim(),String(D?.name||"").trim()||String(D?.id||"").trim()])),[e]),$=F(()=>String(e.find(D=>D?.default)?.id||"").trim(),[e]),S=e.length>0,C=async D=>{r(!0);try{let z=await Fr(D);u(null),N("Channel updated","success"),z?.restartRequired&&Sb(),await Promise.all([x(),Promise.resolve(s?.())])}catch(z){N(z.message||"Could not update channel","error")}finally{r(!1)}},_=async D=>{r(!0),a("Creating...");try{let z=await Ea({payload:D,onPhase:E=>{a(String(E||"").trim()||"Creating...")}});u(null),N("Channel configured","success"),z?.restartRequired&&Sb(),await Promise.all([x(),Promise.resolve(s?.())])}catch(z){N(z.message||"Could not configure channel","error")}finally{r(!1),a("Creating...")}},k=async()=>{if(p){r(!0);try{await $a({provider:p.provider,accountId:p.id}),f(null),N("Channel deleted","success"),await Promise.all([x(),Promise.resolve(s?.())])}catch(D){N(D.message||"Could not delete channel","error")}finally{r(!1)}}},A=D=>{c(""),u({id:"default",provider:D,name:Lt(D).label,ownerAgentId:$,mode:"create"})},O=F(()=>{if(m||!t)return[];let D=new Map(b.map((E,M)=>[String(E?.channel||"").trim(),M])),z=new Map(b.flatMap(E=>(Array.isArray(E?.accounts)?E.accounts:[]).map((M,R)=>[`${String(E?.channel||"").trim()}:${String(M?.id||"").trim()||"default"}`,R])));return Array.from(new Set([...b.map(E=>String(E?.channel||"").trim())])).filter(Boolean).flatMap(E=>{let M=t[E],R=v.get(E),B=Array.isArray(R?.accounts)?R.accounts:[];return R?B.map(I=>{let U=String(I?.id||"").trim()||"default",W=M?.accounts?.[U]||M||null,G=String(W?.status||I?.status||"configured").trim(),se=Number(W?.paired??I?.paired??M?.paired??0),K=E==="telegram"&&G==="paired"&&n,j=String(I?.boundAgentId||"").trim(),X=j||(gs({accountId:U,boundAgentId:j})?$:""),de=w.get(X)||X||"",le={id:U,provider:E,name:qs({channelId:E,account:I,providerLabel:Lt(E).label||"Channel"}),ownerAgentId:X,envKey:String(I?.envKey||"").trim(),token:String(I?.token||"").trim()},ie=en`
                  <div class="flex items-center gap-1.5">
                    ${S&&de&&G==="paired"?en`<${Ks}
                            status=${G}
                            ownerAgentName=${de}
                            showAgentBadge=${S}
                            channelId=${E}
                            pairedCount=${se}
                          />`:null}
                    ${G==="paired"?S&&de?null:en`<${Ks}
                              status=${G}
                              ownerAgentName=""
                              showAgentBadge=${!1}
                              channelId=${E}
                              pairedCount=${se}
                            />`:en`<${Ks}
                            status=${G}
                            ownerAgentName=""
                            showAgentBadge=${!1}
                            channelId=${E}
                            pairedCount=${se}
                          />`}
                    <${pt}
                      open=${l===`${E}:${U}`}
                      ariaLabel="Open channel actions"
                      title="Open channel actions"
                      onClose=${()=>c("")}
                      onToggle=${()=>c(ne=>ne===`${E}:${U}`?"":`${E}:${U}`)}
                    >
                      <${We}
                        onClick=${()=>{c(""),u(le)}}
                      >
                        Edit
                      </${We}>
                      <${We}
                        className="text-status-error hover:text-status-error"
                        onClick=${()=>{c(""),f(le)}}
                      >
                        Delete
                      </${We}>
                    </${pt}>
                  </div>
                `;return{id:`${E}:${U}`,channel:E,channelOrder:Number(D.get(E)??9999),accountOrder:Number(z.get(`${E}:${U}`)??9999),label:qs({channelId:E,account:I,providerLabel:Lt(E).label||"Channel"}),isAwaitingPairing:G!=="paired",detailText:K?"Workspace":"",detailChevron:K,clickable:K,onClick:K?()=>n(`telegram/${encodeURIComponent(U)}`):void 0,trailing:ie}}):[]}).sort((E,M)=>{let R=+!!E?.isAwaitingPairing-+!!M?.isAwaitingPairing;if(R!==0)return R;let B=Number(E?.channelOrder??9999)-Number(M?.channelOrder??9999);if(B!==0)return B;let I=Number(E?.accountOrder??9999)-Number(M?.accountOrder??9999);return I!==0?I:String(E?.label||"").localeCompare(String(M?.label||""))})},[w,e.length,b,t,v,$,m,l,n,S]);return en`
    <div class="space-y-3">
      <${Oa}
        title="Channels"
        items=${O}
        loadingLabel=${m?"Loading...":"No channels configured"}
        actions=${en`
          <${Ra}
            open=${l==="__create_channel"}
            onClose=${()=>c("")}
            onToggle=${()=>c(D=>D==="__create_channel"?"":"__create_channel")}
            triggerDisabled=${o||m}
            channelIds=${bs}
            getChannelMeta=${Lt}
            isChannelDisabled=${D=>Ia({configuredChannelMap:v,provider:D})}
            onSelectChannel=${A}
          />
        `}
      />
      <${qr}
        visible=${!!d}
        loading=${o}
        createLoadingLabel=${i}
        agents=${e}
        existingChannels=${b}
        mode=${d?.mode==="create"?"create":"edit"}
        account=${d}
        initialAgentId=${String(d?.ownerAgentId||"").trim()}
        initialProvider=${String(d?.provider||"").trim()}
        onClose=${()=>u(null)}
        onSubmit=${d?.mode==="create"?_:C}
      />
      <${st}
        visible=${!!p}
        title="Delete channel?"
        message=${`Remove ${String(p?.name||"this channel").trim()} from your configured channels?`}
        confirmLabel="Delete"
        confirmLoadingLabel="Deleting..."
        confirmTone="warning"
        confirmLoading=${o}
        onConfirm=${k}
        onCancel=${()=>{o||f(null)}}
      />
    </div>
  `};var Pe=P.bind(T),LS=[{id:"telegram",title:"Telegram",fieldKeys:["TELEGRAM_BOT_TOKEN"]},{id:"discord",title:"Discord",fieldKeys:["DISCORD_BOT_TOKEN"]},{id:"slack",title:"Slack",fieldKeys:["SLACK_BOT_TOKEN","SLACK_APP_TOKEN"]}],_b=({activeGroup:t,vals:e,hasAi:n,setValue:s,modelOptions:o,modelsLoading:r,modelsError:i,canToggleFullCatalog:a,showAllModels:l,setShowAllModels:c,selectedProvider:d,codexLoading:u,codexStatus:p,startCodexAuth:f,handleCodexDisconnect:g,codexAuthStarted:m,codexAuthWaiting:h,codexManualInput:b,setCodexManualInput:x,completeCodexAuth:v,codexExchanging:w,visibleAiFieldKeys:$,error:S,step:C,totalGroups:_,currentGroupValid:k,goBack:A,goNext:O,loading:D,githubStepLoading:z,allValid:E,handleSubmit:M})=>{let[R,B]=y(!1),[I,U]=y(!1),[W,G]=y(()=>new Set(["telegram"])),se=e._GITHUB_FLOW||An,K=se===Bt?Tn:e._GITHUB_TARGET_REPO_MODE||Tn,j=se===Bt||K===qn?"ghp_... or github_pat_...":"ghp_...";L(()=>{t.id},[t.id]),L(()=>{C===_-1&&(B(!e.OPENAI_API_KEY),U(!e.GEMINI_API_KEY))},[C===_-1]),L(()=>{t.id==="channels"&&G(ne=>ne.size>0?ne:new Set(["telegram"]))},[t.id]);let X=ne=>Pe`
    <div class="space-y-1" key=${ne.key}>
      <label class="text-xs font-medium text-fg-muted">${ne.label}</label>
      <${Rt}
        key=${ne.key}
        value=${e[ne.key]||""}
        onInput=${xe=>s(ne.key,xe.target.value)}
        placeholder=${t.id==="github"&&ne.key==="GITHUB_TOKEN"?j:ne.placeholder||""}
        isSecret=${!ne.isText}
        inputClass="flex-1 bg-field border border-border rounded-lg px-3 py-2 text-sm text-body outline-none focus:border-fg-muted font-mono"
      />
      <p class="text-xs text-fg-dim">
        ${t.id==="github"&&ne.key==="GITHUB_WORKSPACE_REPO"?se===Bt?"Your new project will live here":K===qn?"Enter the owner/repo of an existing empty repository":"A new private repo will be created for you":t.id==="github"&&ne.key==="_GITHUB_SOURCE_REPO"?"The repo to import from":t.id==="github"&&ne.key==="GITHUB_TOKEN"?se===Bt?K===Tn?Pe`Use a classic PAT with${" "}<code
                        class="text-xs bg-field px-1 rounded"
                        >repo</code
                      >${" "}scope to create the target repo. Fine-grained
                      works if the target already exists and can access both
                      repos.`:Pe`Use a classic PAT with${" "}<code
                        class="text-xs bg-field px-1 rounded"
                        >repo</code
                      >${" "}scope, or a fine-grained token with Contents +
                      Metadata access to both the source repo and target
                      repo`:K===qn?Pe`Use a classic PAT with${" "}<code
                        class="text-xs bg-field px-1 rounded"
                        >repo</code
                      >${" "}scope, or a fine-grained token with Contents +
                      Metadata access to this repo`:Pe`Use a classic PAT with${" "}<code
                        class="text-xs bg-field px-1 rounded"
                        >repo</code
                      >${" "}scope to create a new private repository`:ne.hint}
      </p>
    </div>
  `,de=new Map((t.fields||[]).map(ne=>[ne.key,ne])),le=ne=>G(xe=>{let he=new Set(xe);return he.has(ne)?he.delete(ne):he.add(ne),he}),ie=()=>Pe`<div class="space-y-2">
      ${LS.map(ne=>{let xe=W.has(ne.id),he=ne.fieldKeys.map(V=>de.get(V)).filter(Boolean),ue=Lt(ne.id),me=ne.fieldKeys.some(V=>String(e[V]||"").trim());return Pe`
          <div class="bg-field border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onclick=${()=>le(ne.id)}
              class="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-surface"
            >
              <span class="inline-flex items-center gap-2 min-w-0">
                ${ue.iconSrc?Pe`<img
                      src=${ue.iconSrc}
                      alt=""
                      class="w-4 h-4 rounded-sm"
                      aria-hidden="true"
                    />`:null}
                <span class="text-sm text-body">${ne.title}</span>
                ${me?Pe`<${ae} tone="success">Configured</${ae}>`:null}
              </span>
              <span
                class=${`ac-history-toggle shrink-0 transition-transform ${xe?"rotate-90":""}`}
                aria-hidden="true"
                >▸</span
              >
            </button>
            ${xe?Pe`
                  <div class="px-3 pb-3 pt-2 space-y-2 border-t border-border">
                    ${he.map(V=>X(V))}
                  </div>
                `:null}
          </div>
        `})}
    </div>`;return Pe`
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-sm font-medium text-body">${t.title}</h2>
        <p class="text-xs text-fg-muted">${t.description}</p>
      </div>
      ${t.validate(e,{hasAi:n})?Pe`<span
            class="text-xs font-medium px-2 py-0.5 rounded-full bg-status-success-bg text-status-success"
            >✓</span
          >`:t.id!=="tools"?Pe`<span
              class="text-xs font-medium px-2 py-0.5 rounded-full bg-status-warning-bg text-status-warning-muted"
              >Required</span
            >`:null}
    </div>

    ${t.id==="ai"&&Pe`
      <div class="space-y-1">
        <label class="text-xs font-medium text-fg-muted">Model</label>
        <select
          value=${e.MODEL_KEY||""}
          onInput=${ne=>s("MODEL_KEY",ne.target.value)}
          class="w-full bg-field border border-border rounded-lg pl-3 pr-8 py-2 text-sm text-body outline-none focus:border-fg-muted"
        >
          <option value="">Select a model</option>
          ${o.map(ne=>Pe`
              <option value=${ne.key}>${ne.label||ne.key}</option>
            `)}
        </select>
        <p class="text-xs text-fg-dim">
          ${r?"Loading model catalog...":i||""}
        </p>
        ${a&&Pe`
          <button
            type="button"
            onclick=${()=>c(ne=>!ne)}
            class="text-xs text-fg-muted hover:text-body"
          >
            ${l?"Show recommended models":"Show full model catalog"}
          </button>
        `}
      </div>
    `}
    ${t.id==="ai"&&d==="openai-codex"&&Pe`
      <div class="bg-field border border-border rounded-lg p-3 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs text-fg-muted">Codex OAuth</span>
          ${u?Pe`<span class="text-xs text-fg-muted">Checking...</span>`:p.connected?Pe`<${ae} tone="success">Connected</${ae}>`:Pe`<${ae} tone="warning">Not connected</${ae}>`}
        </div>
        <div class="flex gap-2">
          <${Z}
            onClick=${f}
            tone=${p.connected||m?"neutral":"primary"}
            size="sm"
            idleLabel=${p.connected?"Reconnect Codex":"Connect Codex OAuth"}
            className="font-medium"
          />
          ${p.connected&&Pe`
            <${Z}
              onClick=${g}
              tone="ghost"
              size="sm"
              idleLabel="Disconnect"
              className="font-medium"
            />
          `}
        </div>
        ${!p.connected&&m&&Pe`
          <div class="space-y-1 pt-1">
            <p class="text-xs text-fg-muted">
              ${h?"Complete login in the popup, then paste the full redirect URL from the address bar (starts with ":"Paste the full redirect URL from the address bar (starts with "}
              <code class="text-xs bg-field px-1 rounded"
                >http://localhost:1455/auth/callback</code
              >) ${" to finish setup."}
            </p>
            <input
              type="text"
              value=${b}
              onInput=${ne=>x(ne.target.value)}
              placeholder="http://localhost:1455/auth/callback?code=...&state=..."
              class="w-full bg-field border border-border rounded-lg px-3 py-2 text-xs text-body outline-none focus:border-fg-muted"
            />
            <${Z}
              onClick=${v}
              disabled=${!b.trim()||w}
              loading=${w}
              tone="primary"
              size="sm"
              idleLabel="Complete Codex OAuth"
              loadingLabel="Completing..."
              className="font-medium"
            />
          </div>
        `}
      </div>
    `}
    ${t.id==="github"&&Pe`
      <div class="space-y-3">
        ${se===An?Pe`
              <div class="space-y-1">
                <${Xe}
                  options=${[{label:"Create new repo",value:Tn},{label:"Use existing empty repo",value:qn}]}
                  value=${K}
                  onChange=${ne=>s("_GITHUB_TARGET_REPO_MODE",ne)}
                  fullWidth=${!0}
                />
              </div>
            `:null}
      </div>
    `}
    ${t.id==="channels"?ie():(t.id==="ai"?t.fields.filter(ne=>$.has(ne.key)):t.id==="github"?t.fields.filter(ne=>se===Bt?!0:ne.key!=="_GITHUB_SOURCE_REPO"):t.fields).map(ne=>X(ne))}
    ${S?Pe`<div
          class="bg-status-error-bg border border-status-error-border rounded-xl p-3 text-status-error text-sm"
        >
          ${S}
        </div>`:null}
    ${C===_-1&&(R||I)?Pe`
          ${R?Pe`<div class="space-y-1">
                <label class="text-xs font-medium text-fg-muted"
                  >OpenAI API Key</label
                >
                <${Rt}
                  value=${e.OPENAI_API_KEY||""}
                  onInput=${ne=>s("OPENAI_API_KEY",ne.target.value)}
                  placeholder="sk-..."
                  isSecret=${!0}
                  inputClass="flex-1 bg-field border border-border rounded-lg px-3 py-2 text-sm text-body outline-none focus:border-fg-muted font-mono"
                />
                <p class="text-xs text-fg-dim">
                  Used for memory embeddings -${" "}
                  <a
                    href="https://platform.openai.com"
                    target="_blank"
                    class="hover:underline"
                    style="color: var(--accent-link)"
                    >get key</a
                  >
                </p>
              </div>`:null}
          ${I?Pe`<div class="space-y-1">
                <label class="text-xs font-medium text-fg-muted"
                  >Gemini API Key</label
                >
                <${Rt}
                  value=${e.GEMINI_API_KEY||""}
                  onInput=${ne=>s("GEMINI_API_KEY",ne.target.value)}
                  placeholder="AI..."
                  isSecret=${!0}
                  inputClass="flex-1 bg-field border border-border rounded-lg px-3 py-2 text-sm text-body outline-none focus:border-fg-muted font-mono"
                />
                <p class="text-xs text-fg-dim">
                  Used for memory embeddings and Nano Banana -${" "}
                  <a
                    href="https://aistudio.google.com"
                    target="_blank"
                    class="hover:underline"
                    style="color: var(--accent-link)"
                    >get key</a
                  >
                </p>
              </div>`:null}
        `:null}

    <div class="grid grid-cols-2 gap-2 pt-3">
      ${C<_-1?Pe`
            ${C>=0?Pe`<${Z}
                  onClick=${A}
                  tone="secondary"
                  size="md"
                  idleLabel="Back"
                  className="w-full"
                />`:Pe`<div class="w-full"></div>`}
            <${Z}
              onClick=${O}
              disabled=${!k}
              loading=${t.id==="github"&&z}
              tone="primary"
              size="md"
              idleLabel=${t.id==="github"&&se===Bt?"Check compatibility":"Next"}
              loadingLabel="Checking..."
              className="w-full"
            />
          `:Pe`
            ${C>=0?Pe`<${Z}
                  onClick=${A}
                  tone="secondary"
                  size="md"
                  idleLabel="Back"
                  className="w-full"
                />`:Pe`<div class="w-full"></div>`}
            <${Z}
              onClick=${M}
              disabled=${!E}
              loading=${D}
              tone="primary"
              size="md"
              idleLabel="Next"
              loadingLabel="Starting..."
              className="w-full"
            />
          `}
    </div>
  `};var Rn=P.bind(T),ES={telegram:{label:"Telegram",iconSrc:"/assets/icons/telegram.svg"},discord:{label:"Discord",iconSrc:"/assets/icons/discord.svg"}},IS=({pairing:t,onApprove:e,onReject:n})=>{let[s,o]=y(""),r=async()=>{o("approve");try{await e(t.id,t.channel,t.accountId||"")}finally{o("")}},i=async()=>{o("reject");try{await n(t.id,t.channel,t.accountId||"")}finally{o("")}};return Rn`
    <div class="bg-field rounded-lg p-3 mb-2">
      <div class="flex items-center justify-between gap-2 mb-2">
        <div class="font-medium text-sm">
          ${t.code||t.id||"Pending request"}
        </div>
        <span
          class="text-[11px] px-2 py-0.5 rounded-full border border-border text-fg-muted"
        >
          Request
        </span>
      </div>
      <p class="text-xs text-fg-muted mb-3">
        Approve to connect this account and finish setup.
      </p>
      <div class="flex gap-2">
        <button
          onclick=${r}
          disabled=${!!s}
          class="ac-btn-green text-xs font-medium px-3 py-1.5 rounded-lg ${s?"opacity-50 cursor-not-allowed":""}"
        >
          ${s==="approve"?"Approving...":"Approve"}
        </button>
        <button
          onclick=${i}
          disabled=${!!s}
          class="ac-btn-secondary text-xs font-medium px-3 py-1.5 rounded-lg ${s?"opacity-50 cursor-not-allowed":""}"
        >
          ${s==="reject"?"Rejecting...":"Reject"}
        </button>
      </div>
    </div>
  `},Mb=({channel:t,pairings:e,channels:n,loading:s,error:o,onApprove:r,onReject:i,canFinish:a,onContinue:l,onSkip:c})=>{let d=ES[t]||{label:t?t.charAt(0).toUpperCase()+t.slice(1):"Channel",iconSrc:""},u=n?.[t];return t?a?Rn`
      <div class="min-h-[300px] pb-6 px-6 flex flex-col">
        <div class="flex-1 flex items-center justify-center text-center">
          <div class="space-y-3 max-w-xl mx-auto">
            <p class="text-sm font-medium text-status-success mb-12">
              🎉 Setup complete
            </p>
            <p class="text-xs text-body">
              Your ${d.label} channel is connected. You can switch
              to ${d.label} and start using your agent now.
            </p>
            <p class="text-xs text-fg-muted font-normal opacity-85">
              Continue to the dashboard to explore extras like Google Workspace
              and additional integrations.
            </p>
          </div>
        </div>
        <button
          onclick=${l}
          class="w-full max-w-xl mx-auto text-sm font-medium px-4 py-2.5 rounded-xl transition-all ac-btn-cyan mt-3"
        >
          Continue to dashboard
        </button>
      </div>
    `:Rn`
    <div class="min-h-[300px] pb-6 flex flex-col gap-3">
      <div class="flex items-center justify-end gap-2">
        <${ae} tone="warning"
          >${s?"Checking...":e.length>0?"Pairing request detected":"Awaiting pairing"}</${ae}
        >
      </div>

      ${e.length>0?Rn`<div class="flex-1 flex items-center">
              <div class="w-full">
                ${e.map(p=>Rn`<${IS}
                      key=${p.id}
                      pairing=${p}
                      onApprove=${r}
                      onReject=${i}
                    />`)}
              </div>
            </div>`:Rn`<div
              class="flex-1 flex items-center justify-center text-center py-4"
            >
              <div class="space-y-4">
                ${d.iconSrc?Rn`<img
                      src=${d.iconSrc}
                      alt=${d.label}
                      class="w-8 h-8 mx-auto rounded-md"
                    />`:null}
                <p class="text-body text-sm">
                  Send a message to your ${d.label} bot
                </p>
                <p class="text-fg-dim text-xs">
                  The pairing request will appear here in 5-10 seconds
                </p>
              </div>
            </div>`}

      ${o?Rn`<div
              class="bg-status-error-bg border border-status-error-border rounded-xl p-3 text-status-error text-sm"
            >
              ${o}
            </div>`:null}
      ${e.length===0?Rn`<div class="pt-3 text-center">
              <button
                type="button"
                onclick=${c}
                class="ac-tip-link text-xs font-medium"
              >
                Skip pairing for now
              </button>
            </div>`:null}
    </div>
  `:Rn`
      <div
        class="bg-status-error-bg border border-status-error-border rounded-xl p-3 text-status-error text-sm"
      >
        Missing channel configuration. Go back and add a Telegram or Discord bot
        token.
      </div>
    `};var Sd=(t={})=>t.TELEGRAM_BOT_TOKEN?"telegram":t.DISCORD_BOT_TOKEN?"discord":t.SLACK_BOT_TOKEN&&t.SLACK_APP_TOKEN?"slack":"",Ab=(t={},e="")=>{if(!e)return!1;let n=t?.[e];return n?n.status==="paired"&&Number(n.paired||0)>0:!1};var Cd="alphaclaw.ui.settings",Jr="alphaclaw.browse.viewerMode",Ba="alphaclaw.browse.editorSelection",_d="alphaclaw.browse.expandedFolders",Fa="alphaclaw.browse.draft.",Md="alphaclaw.browse.draftIndex",Zr="alphaclaw.onboarding.state",Ha="alphaclaw.telegram.workspaceState",Wa="alphaclaw.telegram.workspaceCache",Ad="alphaclaw.agent.sessionsCache",Td="alphaclaw.agent.lastSessionKey";var Tb="_step",Pd="_pairingChannel",Pb="_lastSetupError",DS=()=>{try{return JSON.parse(localStorage.getItem(Zr)||"{}")}catch{return{}}},Rb=({kSetupStepIndex:t,kPairingStepIndex:e}={})=>{let[n]=y(DS),[s,o]=y(()=>({...n})),[r,i]=y(null),l=!!String(n?.[Pb]||"").trim(),[c,d]=y(()=>{let p=Number.parseInt(String(n?.[Tb]||""),10);if(!Number.isFinite(p))return-1;let f=Math.max(-1,Math.min(e,p));return f===t&&l?0:f});return L(()=>{localStorage.setItem(Zr,JSON.stringify({...s,[Tb]:c,...r?{[Pb]:r}:{}}))},[s,c,r]),{vals:s,setVals:o,setValue:(p,f)=>o(g=>({...g,[p]:f})),step:c,setStep:d,setupError:r,setSetupError:i}};var Lb=({setFormError:t}={})=>{let[e,n]=y({connected:!1}),[s,o]=y(!0),[r,i]=y(""),[a,l]=y(!1),[c,d]=y(!1),[u,p]=y(!1),f=ee(null),g=async()=>{try{let x=await Po();n(x),x?.connected&&(d(!1),p(!1))}catch{n({connected:!1})}finally{o(!1)}};return L(()=>{g()},[]),L(()=>{let x=async v=>{v.data?.codex==="success"&&await g(),v.data?.codex==="error"&&t(`Codex auth failed: ${v.data.message||"unknown error"}`)};return window.addEventListener("message",x),()=>window.removeEventListener("message",x)},[t]),L(()=>()=>{f.current&&(clearInterval(f.current),f.current=null)},[]),{codexStatus:e,codexLoading:s,codexManualInput:r,setCodexManualInput:i,codexExchanging:a,codexAuthStarted:c,codexAuthWaiting:u,startCodexAuth:()=>{if(e.connected)return;d(!0),p(!0);let x="/auth/codex/start",v=window.open(x,"codex-auth","popup=yes,width=640,height=780");if(!v||v.closed){p(!1),window.location.href=x;return}f.current&&clearInterval(f.current),f.current=setInterval(()=>{v.closed&&(clearInterval(f.current),f.current=null,p(!1))},500)},completeCodexAuth:async()=>{if(!(!r.trim()||a)){l(!0),t(null);try{let x=await Wr(r.trim());if(!x.ok)throw new Error(x.error||"Codex OAuth exchange failed");i(""),d(!1),p(!1),await g()}catch(x){t(x.message||"Codex OAuth exchange failed")}finally{l(!1)}}},handleCodexDisconnect:async()=>{let x=await Hr();if(!x.ok){t(x.error||"Failed to disconnect Codex");return}d(!1),p(!1),i(""),await g()}}};var Re=(t,e,{enabled:n=!0,pauseWhenHidden:s=!0,cacheKey:o=""}={})=>{let r=String(o||""),[i,a]=y(()=>r?ms(r):null),[l,c]=y(null),d=ee(t);d.current=t;let u=q(async()=>{try{let p=await d.current();return r&&La(r,p),a(p),c(null),p}catch(p){return c(p),null}},[r]);return L(()=>{if(!r)return;let p=ms(r);p!==null&&a(p)},[r]),L(()=>{if(!n||s&&typeof document<"u"&&document.hidden)return;u();let p=setInterval(u,e);return()=>clearInterval(p)},[n,e,s,u]),L(()=>{if(!n||!s||typeof document>"u")return;let p=()=>{document.hidden||u()};return document.addEventListener("visibilitychange",p),()=>document.removeEventListener("visibilitychange",p)},[n,s,u]),{data:i,error:l,refresh:u}};var Eb=({isPairingStep:t=!1,selectedPairingChannel:e=""}={})=>{let[n,s]=y(null),[o,r]=y(!1),i=Re(So,3e3,{enabled:t}),a=Re(async()=>((await Co()).pending||[]).filter(m=>m.channel===e),1e3,{enabled:t&&!!e}),l=i.data?.channels||{},c=Ab(l,e);return L(()=>{t&&c&&r(!0)},[t,c]),{pairingStatusPoll:i,pairingRequestsPoll:a,pairingChannels:l,canFinishPairing:c,pairingError:n,pairingComplete:o,handlePairingApprove:async(f,g,m="")=>{try{s(null);let h=await _o(f,g,m);if(!h.ok)throw new Error(h.error||"Could not approve pairing");r(!0),a.refresh(),i.refresh()}catch(h){s(h.message||"Could not approve pairing")}},handlePairingReject:async(f,g,m="")=>{try{s(null);let h=await Mo(f,g,m);if(!h.ok)throw new Error(h.error||"Could not reject pairing");a.refresh()}catch(h){s(h.message||"Could not reject pairing")}},resetPairingState:()=>{s(null),r(!1)}}};var Ib=64,NS=128,Db=4096,Rd="import",Nb="secret-review",Va="placeholder-review",Ob="_IMPORT_SUBSTEP",Ld="_IMPORT_PLACEHOLDER_REVIEW",Bb="_IMPORT_PLACEHOLDER_SKIP_CONFIRMED",Fb=(t={})=>{let e=!1,n=Object.entries(t).map(([s,o])=>{let r=typeof o=="string"?o.trim():o;return r!==o&&(e=!0),[s,r]});return{normalizedVals:e?Object.fromEntries(n):t,didChange:e}},Hb=t=>!t||!Array.isArray(t.vars)||t.vars.length===0?{found:!1,count:0,vars:[]}:{found:!0,count:typeof t.count=="number"?t.count:t.vars.length,vars:t.vars.map(e=>({key:String(e?.key||"").trim(),status:String(e?.status||"missing").trim()||"missing"})).filter(e=>e.key)},Wb=({onComplete:t})=>{let e=Ht.length,n=e+1,{vals:s,setVals:o,setValue:r,step:i,setStep:a,setupError:l,setSetupError:c}=Rb({kSetupStepIndex:e,kPairingStepIndex:n}),[d,u]=y([]),[p,f]=y(!0),[g,m]=y(null),[h,b]=y(!1),[x,v]=y(!1),[w,$]=y(!1),[S,C]=y(null),{codexStatus:_,codexLoading:k,codexManualInput:A,setCodexManualInput:O,codexExchanging:D,codexAuthStarted:z,codexAuthWaiting:E,startCodexAuth:M,completeCodexAuth:R,handleCodexDisconnect:B}=Lb({setFormError:C}),[I,U]=y(()=>{let ge=String(s[Ob]||"").trim();return ge===Va?ge:null}),[W,G]=y(null),[se,K]=y(null),[j,X]=y(!1),[de,le]=y(null),ie=ge=>{U(ge),o(bt=>({...bt,[Ob]:ge===Va?ge:""}))},ne=()=>{o(ge=>({...ge,[Ld]:null,[Bb]:!1}))};L(()=>{Br().then(ge=>{let bt=Array.isArray(ge.models)?ge.models:[],Pt=Lo(bt);if(u(bt),!s.MODEL_KEY&&bt.length>0){let xt=Pt[0]||bt[0];o(fn=>({...fn,MODEL_KEY:xt.key}))}}).catch(()=>m("Failed to load models")).finally(()=>f(!1))},[]);let xe=js(s.MODEL_KEY),he=Hb(s[Ld]),ue=Lo(d),me=h?d:ue.length>0?ue:d,V=d.find(ge=>ge.key===s.MODEL_KEY),J=V&&!me.some(ge=>ge.key===V.key)?[...me,V]:me,oe=ue.length>0&&d.length>ue.length,ce=bg(xe),be=Ro(xe),Ve=Mn[be]||[],et=xe==="openai-codex"?!!_.connected:Ve.some(ge=>!!String(s[ge.key]||"").trim()),kt=Ht.every(ge=>ge.validate(s,{hasAi:et})),Ot=i===-1,Q=i===e,pe=i===n,te=i>=0&&i<e?Ht[i]:null,Ee=te?te.validate(s,{hasAi:et}):!1,ke=String(s[Pd]||Sd(s)),{pairingStatusPoll:H,pairingRequestsPoll:re,pairingChannels:ye,canFinishPairing:ve,pairingError:Ie,pairingComplete:gt,handlePairingApprove:Hc,handlePairingReject:Wc,resetPairingState:ea}=Eb({isPairingStep:pe,selectedPairingChannel:ke}),Vc=async()=>{let{normalizedVals:ge,didChange:bt}=Fb(s);if(bt&&o(ge),!Ht.every(Ke=>Ke.validate(ge,{hasAi:et}))||x)return;let Pt=Object.entries(ge).filter(([Ke])=>Ke!=="MODEL_KEY"&&!String(Ke||"").startsWith("_")).filter(([,Ke])=>Ke).map(([Ke,St])=>({key:Ke,value:St})),xt=(()=>{if(!ge.MODEL_KEY||!String(ge.MODEL_KEY).includes("/"))return"A model selection is required";if(Pt.length>Ib)return`Too many environment variables (max ${Ib})`;for(let Ke of Pt){let St=String(Ke?.key||""),Gt=String(Ke?.value||"");if(!St)return"Each variable must include a key";if(St.length>NS)return`Variable key is too long: ${St.slice(0,32)}...`;if(Gt.length>Db)return`Value too long for ${St} (max ${Db} chars)`}return!ge.GITHUB_TOKEN||!zr(ge.GITHUB_WORKSPACE_REPO)?'Target repo must be in "owner/repo" format.':(ge._GITHUB_FLOW||An)===Bt&&!zr(ge._GITHUB_SOURCE_REPO)?'Source repo must be in "owner/repo" format.':""})();if(xt){C(xt),c(null),a(Math.max(0,Ht.findIndex(Ke=>Ke.id==="github")));return}a(e),v(!0),C(null),c(null),ea();let fn=(ge._GITHUB_FLOW||An)===Bt;try{let Ke=await Om(Pt,ge.MODEL_KEY,{importMode:fn});if(!Ke.ok)throw new Error(Ke.error||"Onboarding failed");let St=Sd(ge);if(!St)throw new Error("No Telegram or Discord bot token configured for pairing.");o(Gt=>({...Gt,[Pd]:St})),v(!1),a(n),ea(),c(null)}catch(Ke){console.error("Onboard error:",Ke),c(Ke.message||"Onboarding failed"),v(!1)}},Cr=()=>{localStorage.removeItem(Zr),t()},jc=()=>{Q||(C(null),a(ge=>Math.max(-1,ge-1)))},ta=()=>{v(!1),c(null),a(Ht.length-1)},Kt=async()=>{let{normalizedVals:ge,didChange:bt}=Fb(s);if(bt&&o(ge),!(!te||!te.validate(ge,{hasAi:et}))){if(C(null),te.id==="github"){let Pt=ge._GITHUB_FLOW||An,xt=Pt===Bt?Tn:ge._GITHUB_TARGET_REPO_MODE||Tn,fn=xt===qn?hd:fd,Ke=Pt===Bt?ge._GITHUB_SOURCE_REPO:ge.GITHUB_WORKSPACE_REPO;$(!0),ne();try{if(Pt===Bt){let Gt=await va(Ke,ge.GITHUB_TOKEN,hd);if(!Gt?.ok){C(Gt?.error||"GitHub source verification failed");return}if(Gt.repoIsEmpty){C("That source repository is empty. Use Start fresh if you want AlphaClaw to bootstrap a new setup there.");return}let vo=await va(ge.GITHUB_WORKSPACE_REPO,ge.GITHUB_TOKEN,fd);if(!vo?.ok){C(vo?.error||"GitHub target verification failed");return}if(xt===Tn&&vo.repoExists){C("That target repository already exists. Choose Use existing empty repo or pick a new target repo name.");return}if(xt===qn&&!vo.repoExists){C("That target repository does not exist yet. Choose Create new repo or enter an existing empty target repo.");return}if(Gt.tempDir&&!Gt.repoIsEmpty){G(Gt.tempDir),ie(Rd),X(!0),le(null);try{let Hs=await Bm(Gt.tempDir);if(!Hs?.ok){le(Hs?.error||"Import scan failed"),X(!1);return}K(Hs)}catch(Hs){le(Hs?.message||"Import scan failed")}finally{X(!1)}return}}let St=await va(ge.GITHUB_WORKSPACE_REPO,ge.GITHUB_TOKEN,fn);if(!St?.ok){C(St?.error||"GitHub verification failed");return}if(xt===Tn&&St.repoExists){C("That target repository already exists. Choose Use existing empty repo or pick a new target repo name.");return}if(xt===qn&&!St.repoExists){C("That target repository does not exist yet. Choose Create new repo or enter an existing empty target repo.");return}}catch(St){C(St?.message||"GitHub verification failed");return}finally{$(!1)}}a(Pt=>Math.min(Ht.length-1,Pt+1))}},Vf=async(ge=[])=>{X(!0),le(null);try{let bt=ge.length===0,Pt=kg(ge),xt=await Fm({tempDir:W,approvedSecrets:ge,skipSecretExtraction:bt,githubRepo:s.GITHUB_WORKSPACE_REPO,githubToken:s.GITHUB_TOKEN});if(!xt?.ok){le(xt?.error||"Import failed"),X(!1);return}let fn=Hb(xt.placeholderReview);if(o(Ke=>({...Ke,...Pt,...xt.preFill||{},[Ld]:fn,[Bb]:!1})),fn.found){ie(Va);return}ne(),ie(null),a(Ke=>Math.min(Ht.length-1,Ke+1))}catch(bt){le(bt?.message||"Import failed")}finally{X(!1)}},go=()=>{ie(Nb)},bo=()=>{ie(Rd)},_r=()=>{ie(null),G(null),K(null),le(null),ne()},na=()=>{ne(),ie(null),a(ge=>Math.min(Ht.length-1,ge+1))},ps=ge=>{r("_GITHUB_FLOW",ge),a(0)},xo=I===Rd,Fs=I===Nb,fs=I===Va,Gn=Ot?"Getting Started":xo?"Import":Fs?"Review Secrets":fs?"Review Env Vars":Q?"Initializing":pe?"Pairing":te?.title||"Setup",yo=Ot?0:xo||Fs||fs?i+1:Q?Ht.length+1:pe?Ht.length+2:i+1;return{state:{vals:s,step:i,setupError:l,modelsLoading:p,modelsError:g,showAllModels:h,loading:x,githubStepLoading:w,formError:S,importScanResult:se,importScanning:j,importError:de,selectedProvider:xe,modelOptions:J,canToggleFullCatalog:oe,visibleAiFieldKeys:ce,hasAi:et,allValid:kt,isPreStep:Ot,isSetupStep:Q,isPairingStep:pe,activeGroup:te,currentGroupValid:Ee,selectedPairingChannel:ke,placeholderReview:he,isImportStep:xo,isSecretReviewStep:Fs,isPlaceholderReviewStep:fs,activeStepLabel:Gn,stepNumber:yo,codexStatus:_,codexLoading:k,codexManualInput:A,codexExchanging:D,codexAuthStarted:z,codexAuthWaiting:E,pairingStatusPoll:H,pairingRequestsPoll:re,pairingChannels:ye,canFinishPairing:ve,pairingError:Ie,pairingComplete:gt},actions:{setVals:o,setValue:r,setShowAllModels:b,setCodexManualInput:O,startCodexAuth:M,completeCodexAuth:R,handleCodexDisconnect:B,handleSubmit:Vc,finishOnboarding:Cr,goBack:jc,goBackFromSetupError:ta,goNext:Kt,handleSelectFlow:ps,handleImportApprove:Vf,handleShowSecretReview:go,handleSecretReviewBack:bo,handleImportBack:_r,handlePlaceholderReviewContinue:na,handlePairingApprove:Hc,handlePairingReject:Wc}}};var Jn=P.bind(T),Vb=({onComplete:t,acVersion:e})=>{let{state:n,actions:s}=Wb({onComplete:t});return Jn`
    <div class="max-w-lg w-full space-y-5">
      <${Ag}
        groups=${Ht}
        step=${n.step}
        isPreStep=${n.isPreStep}
        isSetupStep=${n.isSetupStep}
        isPairingStep=${n.isPairingStep}
        stepNumber=${n.stepNumber}
        activeStepLabel=${n.activeStepLabel}
      />

      <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
        ${n.isPreStep?Jn`<${yg} onSelectFlow=${s.handleSelectFlow} />`:n.isImportStep?Jn`<${Sg}
              scanResult=${n.importScanResult}
              scanning=${n.importScanning}
              error=${n.importError}
              onApprove=${s.handleImportApprove}
              onShowSecretReview=${s.handleShowSecretReview}
              onBack=${s.handleImportBack}
            />`:n.isSecretReviewStep?Jn`<${_g}
                secrets=${n.importScanResult?.secrets||[]}
                onApprove=${s.handleImportApprove}
                onBack=${s.handleSecretReviewBack}
                loading=${n.importScanning}
                error=${n.importError}
              />`:n.isPlaceholderReviewStep?Jn`<${Cg}
                  placeholderReview=${n.placeholderReview}
                  vals=${n.vals}
                  setValue=${s.setValue}
                  onContinue=${s.handlePlaceholderReviewContinue}
                />`:n.isSetupStep?Jn`<${Rg}
                    error=${n.setupError}
                    loading=${n.loading}
                    onRetry=${s.handleSubmit}
                    onBack=${s.goBackFromSetupError}
                  />`:n.isPairingStep?Jn`<${Mb}
                      channel=${n.selectedPairingChannel}
                      pairings=${n.pairingRequestsPoll.data||[]}
                      channels=${n.pairingChannels}
                      loading=${!n.pairingStatusPoll.data}
                      error=${n.pairingError}
                      onApprove=${s.handlePairingApprove}
                      onReject=${s.handlePairingReject}
                      canFinish=${n.pairingComplete||n.canFinishPairing}
                      onContinue=${s.finishOnboarding}
                      onSkip=${s.finishOnboarding}
                    />`:Jn`
                      <${_b}
                        activeGroup=${n.activeGroup}
                        vals=${n.vals}
                        hasAi=${n.hasAi}
                        setValue=${s.setValue}
                        modelOptions=${n.modelOptions}
                        modelsLoading=${n.modelsLoading}
                        modelsError=${n.modelsError}
                        canToggleFullCatalog=${n.canToggleFullCatalog}
                        showAllModels=${n.showAllModels}
                        setShowAllModels=${s.setShowAllModels}
                        selectedProvider=${n.selectedProvider}
                        codexLoading=${n.codexLoading}
                        codexStatus=${n.codexStatus}
                        startCodexAuth=${s.startCodexAuth}
                        handleCodexDisconnect=${s.handleCodexDisconnect}
                        codexAuthStarted=${n.codexAuthStarted}
                        codexAuthWaiting=${n.codexAuthWaiting}
                        codexManualInput=${n.codexManualInput}
                        setCodexManualInput=${s.setCodexManualInput}
                        completeCodexAuth=${s.completeCodexAuth}
                        codexExchanging=${n.codexExchanging}
                        visibleAiFieldKeys=${n.visibleAiFieldKeys}
                        error=${n.formError}
                        step=${n.step}
                        totalGroups=${Ht.length}
                        currentGroupValid=${n.currentGroupValid}
                        goBack=${s.goBack}
                        goNext=${s.goNext}
                        loading=${n.loading}
                        githubStepLoading=${n.githubStepLoading}
                        allValid=${n.allValid}
                        handleSubmit=${s.handleSubmit}
                      />
                    `}
      </div>
      ${e?Jn`
            <div class="text-center text-xs text-fg-muted font-mono mt-8">
              v${e}
            </div>
          `:null}
    </div>
  `};var OS=P.bind(T),tn=({onClick:t,disabled:e=!1,loading:n=!1,warning:s=!1,idleLabel:o="Check updates",loadingLabel:r="Checking...",className:i=""})=>OS`
  <${Z}
    onClick=${t}
    disabled=${e}
    loading=${n}
    tone=${s?"warning":"neutral"}
    size="sm"
    idleLabel=${o}
    loadingLabel=${r}
    className=${i}
  />
`;var BS=P.bind(T),jb=({visible:t=!1,restarting:e=!1,onRestart:n,onDismiss:s=()=>{}})=>t?BS`
    <div class="global-restart-banner">
      <div class="global-restart-banner__content">
        <p class="global-restart-banner__text">
          Gateway restart required to apply pending configuration changes.
        </p>
        <div class="global-restart-banner__actions">
          <${tn}
            onClick=${n}
            disabled=${e}
            loading=${e}
            warning=${!0}
            idleLabel="Restart Gateway"
            loadingLabel="Restarting..."
            className="global-restart-banner__button"
          />
          <button
            type="button"
            onclick=${s}
            class="global-restart-banner__dismiss ac-btn-ghost"
            aria-label="Dismiss restart banner"
            title="Dismiss"
          >
            <${nt} className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  `:null;var ja="alphaclaw:browse-draft-index-changed",Fo=t=>t||window.localStorage,Ed=t=>`${Fa}${String(t||"").trim()}`,zb=(t,e)=>{try{if(!t)return"";let s=Fo(e).getItem(Ed(t));return typeof s=="string"?s:""}catch{return""}},za=(t,e,n)=>{try{if(!t)return;Fo(n).setItem(Ed(t),String(e||""))}catch{}},xs=(t,e)=>{try{if(!t)return;Fo(e).removeItem(Ed(t))}catch{}},Ub=t=>{try{let n=Fo(t).getItem(Md);if(!n)return new Set;let s=JSON.parse(n);return Array.isArray(s)?new Set(s.map(o=>String(o||"").trim()).filter(Boolean)):new Set}catch{return new Set}},Kb=(t,e={})=>{let{storage:n,dispatchEvent:s}=e;try{let o=Fo(n),r=Array.from(t).sort((i,a)=>i.localeCompare(a));o.setItem(Md,JSON.stringify(r)),s&&s(new CustomEvent(ja,{detail:{paths:r}}))}catch{}},mn=(t,e,n={})=>{let{storage:s,dispatchEvent:o}=n;if(!t)return;let r=String(t||"").trim();if(!r)return;let i=Ub(s);e?i.add(r):i.delete(r),Kb(i,{storage:s,dispatchEvent:o})},Id=t=>{try{let e=Fo(t),n=Ub(e);if(n.size>0)return n;let s=new Set;for(let o=0;o<e.length;o+=1){let r=e.key(o)||"";if(r.startsWith(Fa)){let i=r.slice(Fa.length).trim();i&&s.add(i)}}return s.size>0&&Kb(s,{storage:e}),s}catch{return new Set}};var FS=new URL("../../shared/browse-file-policies.json",import.meta.url),Yr={protectedPaths:[],lockedPaths:[]};try{let t=await fetch(FS);if(t.ok){let e=await t.json();e&&typeof e=="object"&&(Yr=e)}}catch{}var Ua=new Set(Array.isArray(Yr?.protectedPaths)?Yr.protectedPaths:[]),Zs=new Set(Array.isArray(Yr?.lockedPaths)?Yr.lockedPaths:[]),Ys=t=>String(t||"").replaceAll("\\","/").replace(/^\.\/+/,"").replace(/^\/+/,"").trim().toLowerCase(),Zn=(t,e)=>{let n=String(e||"").trim();if(!n)return!1;for(let s of t)if(n===s||n.endsWith(`/${s}`)||n.startsWith(`${s}/`)||n.includes(`/${s}/`))return!0;return!1};var Gb=t=>{let e=String(t||"").split("/").map(s=>s.trim()).filter(Boolean);if(e.length<=1)return[];let n=[];for(let s=0;s<e.length-1;s+=1)n.push(e.slice(0,s+1).join("/"));return n};var Ho=async t=>{let e=String(t||"");if(!e)return!1;try{if(navigator?.clipboard?.writeText)return await navigator.clipboard.writeText(e),!0}catch{}let n=null,s=!1;try{return!document?.createElement||!document?.body?.appendChild||!document?.body?.removeChild||typeof document.execCommand!="function"?!1:(n=document.createElement("textarea"),n.value=e,n.setAttribute("readonly",""),n.style.position="fixed",n.style.opacity="0",document.body.appendChild(n),s=!0,n.select(),document.execCommand("copy"))}catch{return!1}finally{n&&s&&document.body.removeChild(n)}};var Ge=P.bind(T),Dd=9,HS=10,qb=14,WS=5e3,VS=()=>{try{let t=window.localStorage.getItem(_d);if(!t)return null;let e=JSON.parse(t);return Array.isArray(e)?new Set(e.map(n=>String(n))):null}catch{return null}},Jb=(t,e)=>{!t||t.type!=="folder"||(t.path&&e.add(t.path),(t.children||[]).forEach(n=>Jb(n,e)))},Nd=(t,e)=>{if(t){if(t.type==="file"){t.path&&e.push(t.path);return}(t.children||[]).forEach(n=>Nd(n,e))}},Od=(t,e)=>{if(!t)return null;let n=String(e||"").trim();if(!n)return t;if(String(t.path||"").trim()===n)return null;if(t.type!=="folder")return t;let o=(t.children||[]).map(r=>Od(r,n)).filter(Boolean);return o.length===(t.children||[]).length?t:{...t,children:o}},Zb=(t,e)=>{if(!t)return null;let n=String(e||"").trim().toLowerCase();if(!n)return t;let s=String(t.name||"").toLowerCase(),o=String(t.path||"").toLowerCase(),r=s.includes(n)||o.includes(n);if(t.type==="file")return r?t:null;let i=(t.children||[]).map(a=>Zb(a,n)).filter(Boolean);return!r&&i.length===0?null:{...t,children:i}},jS=t=>{let n=String(t||"").toLowerCase().replace(/(\.bak)+$/i,"");return n.endsWith(".md")?{icon:Xg,className:"file-icon file-icon-md"}:n.endsWith(".js")||n.endsWith(".mjs")?{icon:eb,className:"file-icon file-icon-js"}:n.endsWith(".json")||n.endsWith(".jsonl")?{icon:Ma,className:"file-icon file-icon-json"}:n.endsWith(".css")||n.endsWith(".scss")?{icon:cb,className:"file-icon file-icon-css"}:/\.(html?)$/i.test(n)?{icon:ab,className:"file-icon file-icon-html"}:/\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(n)?{icon:tb,className:"file-icon file-icon-image"}:/\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|weba)$/i.test(n)?{icon:rb,className:"file-icon file-icon-audio"}:/\.(sh|bash|zsh|command)$/i.test(n)||[".bashrc",".zshrc",".profile",".bash_profile",".zprofile",".zshenv"].includes(n)?{icon:ib,className:"file-icon file-icon-shell"}:/\.(db|sqlite|sqlite3|db3|sdb|sqlitedb|duckdb|mdb|accdb)$/i.test(n)?{icon:lb,className:"file-icon file-icon-db"}:{icon:Qg,className:"file-icon file-icon-generic"}},zS=({x:t,y:e,targetPath:n,targetType:s,isLocked:o,onNewFile:r,onNewFolder:i,onCopyPath:a,onDownload:l,onDelete:c,onClose:d})=>{let u=ee(null);L(()=>{let w=C=>{u.current&&!u.current.contains(C.target)&&d()},$=C=>{C.key==="Escape"&&d()},S=()=>d();return window.addEventListener("mousedown",w),window.addEventListener("keydown",$),window.addEventListener("scroll",S,!0),()=>{window.removeEventListener("mousedown",w),window.removeEventListener("keydown",$),window.removeEventListener("scroll",S,!0)}},[d]);let p=s==="folder",f=s==="file",g=s==="root",m=p?n:"",h=!o&&(p||g),b=!!((p||f)&&n),x=f&&n,v=!o&&(p||f)&&n;return Ge`
    <div
      ref=${u}
      class="tree-context-menu"
      style=${{top:`${e}px`,left:`${t}px`}}
    >
      ${h?Ge`
            <button
              class="tree-context-menu-item"
              onclick=${()=>{r(m),d()}}
            >
              <${Kr} className="tree-context-menu-icon" />
              <span>New File</span>
            </button>
            <button
              class="tree-context-menu-item"
              onclick=${()=>{i(m),d()}}
            >
              <${Gr} className="tree-context-menu-icon" />
              <span>New Folder</span>
            </button>
          `:null}
      ${b||x||v?Ge`
            ${h?Ge`<div class="tree-context-menu-sep"></div>`:null}
            ${b?Ge`
                  <button
                    class="tree-context-menu-item"
                    onclick=${()=>{a(n),d()}}
                  >
                    <${Us} className="tree-context-menu-icon" />
                    <span>Copy Path</span>
                  </button>
                `:null}
            ${x?Ge`
                  <button
                    class="tree-context-menu-item"
                    onclick=${()=>{l(n),d()}}
                  >
                    <${hb} className="tree-context-menu-icon" />
                    <span>Download</span>
                  </button>
                `:null}
            ${v?Ge`
                  <button
                    class="tree-context-menu-item"
                    onclick=${()=>{c(n),d()}}
                  >
                    <${Aa} className="tree-context-menu-icon" />
                    <span>Delete</span>
                  </button>
                `:null}
          `:null}
      ${o?Ge`
            <div class="tree-context-menu-item is-disabled">
              <${Oo} className="tree-context-menu-icon" />
              <span>Managed by AlphaClaw</span>
            </div>
          `:null}
    </div>
  `},Ka=({type:t,depth:e,onConfirm:n,onCancel:s})=>{let o=ee(null),[r,i]=y(""),a=ee(!1);L(()=>{o.current?.focus()},[]);let l=()=>{let d=r.trim();if(!d||a.current){s();return}a.current=!0,n(d)},c=t==="folder"?Gr:Kr;return Ge`
    <li class="tree-item">
      <div
        class="tree-create-row"
        style=${{paddingLeft:`${qb+e*Dd}px`}}
      >
        <${c} className="tree-create-icon" />
        <input
          ref=${o}
          class="tree-create-input"
          type="text"
          value=${r}
          onInput=${d=>i(d.target.value)}
          onKeyDown=${d=>{d.key==="Enter"&&(d.preventDefault(),l()),d.key==="Escape"&&(d.preventDefault(),s())}}
          onBlur=${l}
          placeholder=${t==="folder"?"folder name":"file name"}
          autocomplete="off"
          spellcheck=${!1}
        />
      </div>
    </li>
  `},Ga=({node:t,depth:e=0,expandedPaths:n,onSetFolderExpanded:s,onSelectFolder:o,onRequestDelete:r,onSelectFile:i,onContextMenu:a,onDragDrop:l,selectedPath:c="",draftPaths:d,isSearchActive:u=!1,searchActivePath:p="",creatingInFolder:f="",creatingType:g="",onCreationConfirm:m,onCreationCancel:h,dragSourcePath:b=""})=>{if(!t)return null;if(t.type==="file"){let k=c===t.path,A=p===t.path,O=d.has(t.path||""),D=Zn(Zs,Ys(t.path||"")),z=jS(t.name),E=z.icon;return Ge`
      <li class="tree-item${b===t.path?" is-dragging":""}">
        <a
          class=${`${k?"active":""} ${A&&!k?"soft-active":""}`.trim()}
          onclick=${()=>i(t.path)}
          oncontextmenu=${M=>{M.preventDefault(),M.stopPropagation(),a({x:M.clientX,y:M.clientY,targetPath:t.path,targetType:"file",isLocked:D})}}
          draggable=${!D}
          onDragStart=${M=>{if(D){M.preventDefault();return}M.dataTransfer.setData("text/plain",t.path),M.dataTransfer.effectAllowed="move",l("start",t.path)}}
          onDragEnd=${()=>l("end","")}
          onKeyDown=${M=>{!(M.key==="Delete"||M.key==="Backspace")||!k||(M.preventDefault(),r(t.path))}}
          tabindex="0"
          role="button"
          style=${{paddingLeft:`${qb+e*Dd}px`}}
          title=${t.path||t.name}
        >
          <${E} className=${z.className} />
          <span class="tree-label">${t.name}</span>
          ${D?Ge`<${Oo}
                className="tree-lock-icon"
                title="Managed by AlphaClaw"
              />`:O?Ge`<span class="tree-draft-dot" aria-hidden="true"></span>`:null}
        </a>
      </li>
    `}let x=t.path||"",v=u?!1:!n.has(x),w=c===x,$=x&&Zn(Zs,Ys(x)),[S,C]=y(!1),_=ee(0);return Ge`
    <li class="tree-item${b===x?" is-dragging":""}">
      <div
        class=${`tree-folder ${v?"collapsed":""} ${w?"active":""} ${S?"is-drop-target":""}`.trim()}
        onclick=${()=>{x&&(s(x,v),o(x))}}
        oncontextmenu=${k=>{k.preventDefault(),k.stopPropagation(),a({x:k.clientX,y:k.clientY,targetPath:x,targetType:"folder",isLocked:$})}}
        draggable=${!!x&&!$}
        onDragStart=${k=>{if(!x||$){k.preventDefault();return}k.dataTransfer.setData("text/plain",x),k.dataTransfer.effectAllowed="move",l("start",x)}}
        onDragEnd=${()=>{C(!1),_.current=0,l("end","")}}
        onDragOver=${k=>{$||(k.preventDefault(),k.dataTransfer.dropEffect="move")}}
        onDragEnter=${k=>{$||(k.preventDefault(),_.current+=1,_.current===1&&C(!0))}}
        onDragLeave=${()=>{_.current-=1,_.current<=0&&(_.current=0,C(!1))}}
        onDrop=${k=>{if($)return;k.preventDefault(),k.stopPropagation(),C(!1),_.current=0;let A=k.dataTransfer.getData("text/plain");A&&A!==x&&l("drop",A,x)}}
        style=${{paddingLeft:`${HS+e*Dd}px`}}
        title=${x||t.name}
      >
        <button
          type="button"
          class="tree-folder-toggle"
          aria-label=${`${v?"Expand":"Collapse"} ${t.name||"folder"}`}
          aria-expanded=${v?"false":"true"}
          onclick=${k=>{k.preventDefault(),k.stopPropagation(),x&&s(x,v)}}
        >
          <span class="arrow">▼</span>
        </button>
        <span class="tree-label">${t.name}</span>
        ${$?Ge`<${Oo}
              className="tree-lock-icon"
              title="Managed by AlphaClaw"
            />`:null}
      </div>
      <ul class=${`tree-children ${v?"hidden":""}`}>
        ${f===x&&g==="folder"?Ge`
              <${Ka}
                key="__creation__"
                type="folder"
                depth=${e+1}
                onConfirm=${m}
                onCancel=${h}
              />
            `:null}
        ${(t.children||[]).filter(k=>k.type==="folder").map(k=>Ge`
            <${Ga}
              key=${k.path||`${x}/${k.name}`}
              node=${k}
              depth=${e+1}
              expandedPaths=${n}
              onSetFolderExpanded=${s}
              onSelectFolder=${o}
              onRequestDelete=${r}
              onSelectFile=${i}
              onContextMenu=${a}
              onDragDrop=${l}
              selectedPath=${c}
              draftPaths=${d}
              isSearchActive=${u}
              searchActivePath=${p}
              creatingInFolder=${f}
              creatingType=${g}
              onCreationConfirm=${m}
              onCreationCancel=${h}
              dragSourcePath=${b}
            />
          `)}
        ${f===x&&g==="file"?Ge`
              <${Ka}
                key="__creation__"
                type="file"
                depth=${e+1}
                onConfirm=${m}
                onCancel=${h}
              />
            `:null}
        ${(t.children||[]).filter(k=>k.type!=="folder").map(k=>Ge`
            <${Ga}
              key=${k.path||`${x}/${k.name}`}
              node=${k}
              depth=${e+1}
              expandedPaths=${n}
              onSetFolderExpanded=${s}
              onSelectFolder=${o}
              onRequestDelete=${r}
              onSelectFile=${i}
              onContextMenu=${a}
              onDragDrop=${l}
              selectedPath=${c}
              draftPaths=${d}
              isSearchActive=${u}
              searchActivePath=${p}
              creatingInFolder=${f}
              creatingType=${g}
              onCreationConfirm=${m}
              onCreationCancel=${h}
              dragSourcePath=${b}
            />
          `)}
      </ul>
    </li>
  `},Yb=({onSelectFile:t=()=>{},selectedPath:e="",onPreviewFile:n=()=>{},isActive:s=!0})=>{let[o,r]=y(null),[i,a]=y(!0),[l,c]=y(""),[d,u]=y(VS),[p,f]=y(Id),[g,m]=y(""),[h,b]=y(""),[x,v]=y(""),[w,$]=y(!1),[S,C]=y(""),[_,k]=y(""),[A,O]=y(null),[D,z]=y(""),[E,M]=y(""),R=E||e,B=ee(null),I=ee(""),U=q(async({showLoading:H=!1}={})=>{H&&a(!0),H&&c("");try{let ye=(await ig()).root||null,ve=JSON.stringify(ye||{});I.current!==ve&&(I.current=ve,r(ye)),u(Ie=>Ie instanceof Set?Ie:new Set),H&&c("")}catch(re){H&&c(re.message||"Could not load file tree")}finally{H&&a(!1)}},[]);L(()=>{U({showLoading:!0})},[U]),L(()=>{if(!s)return()=>{};let H=()=>{U({showLoading:!1})},re=ve=>{let Ie=String(ve?.detail?.path||"").trim();Ie&&r(gt=>Od(gt,Ie))};H();let ye=window.setInterval(H,WS);return window.addEventListener("alphaclaw:browse-file-saved",H),window.addEventListener("alphaclaw:browse-tree-refresh",H),window.addEventListener("alphaclaw:browse-file-deleted",re),()=>{window.clearInterval(ye),window.removeEventListener("alphaclaw:browse-file-saved",H),window.removeEventListener("alphaclaw:browse-tree-refresh",H),window.removeEventListener("alphaclaw:browse-file-deleted",re)}},[s,U]);let W=String(g||"").trim().toLowerCase(),G=F(()=>{let H=o?.children||[];return W?H.map(re=>Zb(re,W)).filter(Boolean):H},[o,W]),se=d instanceof Set?d:new Set,K=W.length>0,j=F(()=>{let H=[];return G.forEach(re=>Nd(re,H)),H},[G]),X=F(()=>{let H=[];return(o?.children||[]).forEach(re=>Nd(re,H)),new Set(H)},[o]),de=F(()=>{let H=new Set;return G.forEach(re=>Jb(re,H)),H},[G]);L(()=>{if(d instanceof Set)try{window.localStorage.setItem(_d,JSON.stringify(Array.from(d)))}catch{}},[d]),L(()=>{e&&M("")},[e]),L(()=>{if(!e)return;let H=Gb(e);H.length&&u(re=>{if(!(re instanceof Set))return re;let ye=!1,ve=new Set(re);return H.forEach(Ie=>{ve.has(Ie)||(ve.add(Ie),ye=!0)}),ye?ve:re})},[e]),L(()=>{let H=re=>{let ye=re?.detail?.paths;if(Array.isArray(ye)){f(new Set(ye.map(ve=>String(ve||"").trim()).filter(Boolean)));return}f(Id())};return window.addEventListener(ja,H),window.addEventListener("storage",H),()=>{window.removeEventListener(ja,H),window.removeEventListener("storage",H)}},[]),L(()=>{if(!s)return()=>{};let H=re=>{if(re.key!=="/"||re.metaKey||re.ctrlKey||re.altKey)return;let ye=re.target,ve=String(ye?.tagName||"").toLowerCase();(ve==="input"||ve==="textarea"||ve==="select"||ye?.isContentEditable)&&ye!==B.current||(re.preventDefault(),B.current?.focus(),B.current?.select())};return window.addEventListener("keydown",H),()=>{window.removeEventListener("keydown",H)}},[s]),L(()=>{if(!K){b(""),n("");return}h&&j.includes(h)||(b(""),n(""))},[K,j,h,n]);let le=(H,re)=>{u(ye=>{let ve=ye instanceof Set?new Set(ye):new Set;return re===!0?(ve.add(H),ve):re===!1?(ve.delete(H),ve):(ve.has(H)?ve.delete(H):ve.add(H),ve)})},ie=q((H,re)=>{M(""),t(H,re)},[t]),ne=H=>{M(H)},xe=H=>{let re=Ys(H);if(re){if(Zn(Zs,re)||Zn(Ua,re)){N("Protected or locked paths cannot be deleted","warning");return}v(H)}},he=de.has(x),ue=async()=>{if(!(!x||w)){$(!0);try{await wa(x),window.dispatchEvent(new CustomEvent("alphaclaw:browse-file-saved",{detail:{path:x}})),window.dispatchEvent(new CustomEvent("alphaclaw:browse-file-deleted",{detail:{path:x}})),r(H=>Od(H,x)),window.dispatchEvent(new CustomEvent("alphaclaw:browse-tree-refresh")),ie(""),N(he?"Folder deleted":"File deleted","success"),v("")}catch(H){N(H.message||"Could not delete","error")}finally{$(!1)}}},me=H=>{if(H!==void 0)return H;if(!R)return"";if(de.has(R))return R;let re=R.lastIndexOf("/");return re>0?R.slice(0,re):""},V=(H,re)=>{let ye=me(H);if(ye&&Zn(Zs,Ys(ye))){N("Cannot create inside a locked folder","warning");return}C(ye),k(re),ye&&u(ve=>{let Ie=ve instanceof Set?new Set(ve):new Set;return Ie.add(ye),Ie})},J=H=>{V(me(),H)},oe=()=>{C(""),k("")},ce=async H=>{let re=S,ye=_;oe();let ve=re?`${re}/${H}`:H;try{ye==="folder"?(await cg(ve),N("Folder created","success")):(await lg(ve),N("File created","success")),window.dispatchEvent(new CustomEvent("alphaclaw:browse-tree-refresh")),re&&u(Ie=>{let gt=Ie instanceof Set?new Set(Ie):new Set;return gt.add(re),gt}),ye==="file"&&ie(ve)}catch(Ie){N(Ie.message||`Could not create ${ye}`,"error")}},be=H=>{O(H)},Ve=()=>{O(null)},et=async H=>{try{await ug(H),N("Download started","success")}catch(re){N(re.message||"Could not download file","error")}},kt=async H=>{if(await Ho(H)){N("Path copied","success");return}N("Could not copy path","error")},Ot=async(H,re,ye)=>{if(H==="start"){z(re);return}if(H==="end"){z("");return}if(H==="drop"){z("");let ve=re.split("/").pop();if(!ve)return;let Ie=ye?`${ye}/${ve}`:ve;if(re===Ie)return;try{await dg(re,Ie),N(`Moved to ${ye||"root"}`,"success"),window.dispatchEvent(new CustomEvent("alphaclaw:browse-tree-refresh")),e===re&&ie(Ie)}catch(gt){N(gt.message||"Could not move","error")}}},Q=H=>{m(H)},pe=()=>{m(""),b(""),n("")},te=H=>{if(!j.length)return;let re=j.indexOf(h),Ie=((re===-1?H==="up"?0:-1:re)+(H==="up"?-1:1)+j.length)%j.length,gt=j[Ie];b(gt),n(gt)},Ee=()=>{let[H=""]=j,re=h||(j.length===1?H:"");re&&(ie(re),pe())},ke=H=>{if(H.key==="ArrowDown"){H.preventDefault(),te("down");return}if(H.key==="ArrowUp"){H.preventDefault(),te("up");return}if(H.key==="Enter"){H.preventDefault(),Ee();return}H.key==="Escape"&&(H.preventDefault(),pe())};return i?Ge`
      <div class="file-tree-wrap file-tree-wrap-loading">
        <div class="file-tree-state file-tree-state-loading">
          <${Ce} className="h-5 w-5 text-fg-muted" />
        </div>
      </div>
    `:l?Ge`<div class="file-tree-state file-tree-state-error">
      ${l}
    </div>`:!G.length&&!_?Ge`
      <div class="file-tree-wrap">
        <div class="file-tree-search">
          <input
            class="file-tree-search-input"
            type="text"
            ref=${B}
            value=${g}
            onInput=${H=>Q(H.target.value)}
            onKeyDown=${ke}
            placeholder="Search files..."
            autocomplete="off"
            spellcheck=${!1}
          />
          <span class="file-tree-search-actions">
            <button
              type="button"
              class="tree-folder-action"
              title="New file"
              onclick=${()=>J("file")}
            >
              <${Kr} className="tree-folder-action-icon" />
            </button>
            <button
              type="button"
              class="tree-folder-action"
              title="New folder"
              onclick=${()=>J("folder")}
            >
              <${Gr} className="tree-folder-action-icon" />
            </button>
          </span>
        </div>
        <div class="file-tree-state">
          ${K?"No matching files.":"No files found."}
        </div>
      </div>
    `:Ge`
    <div class="file-tree-wrap">
      <div class="file-tree-search">
        <input
          class="file-tree-search-input"
          type="text"
          ref=${B}
          value=${g}
          onInput=${H=>Q(H.target.value)}
          onKeyDown=${ke}
          placeholder="Search files..."
          autocomplete="off"
          spellcheck=${!1}
        />
        <span class="file-tree-search-actions">
          <button
            type="button"
            class="tree-folder-action"
            title="New file"
            onclick=${()=>J("file")}
          >
            <${Kr} className="tree-folder-action-icon" />
          </button>
          <button
            type="button"
            class="tree-folder-action"
            title="New folder"
            onclick=${()=>J("folder")}
          >
            <${Gr} className="tree-folder-action-icon" />
          </button>
        </span>
      </div>
      <div class="file-tree-scroll">
      <ul
        class="file-tree"
        oncontextmenu=${H=>{H.preventDefault(),be({x:H.clientX,y:H.clientY,targetPath:"",targetType:"root"})}}
        onDragOver=${H=>{H.preventDefault(),H.dataTransfer.dropEffect="move"}}
        onDrop=${H=>{H.preventDefault();let re=H.dataTransfer.getData("text/plain");re&&Ot("drop",re,"")}}
      >
        ${S===""&&_==="folder"?Ge`
              <${Ka}
                key="__root-creation__"
                type="folder"
                depth=${0}
                onConfirm=${ce}
                onCancel=${oe}
              />
            `:null}
        ${G.filter(H=>H.type==="folder").map(H=>Ge`
            <${Ga}
              key=${H.path||H.name}
              node=${H}
              expandedPaths=${se}
              onSetFolderExpanded=${le}
              onSelectFolder=${ne}
              onRequestDelete=${xe}
              onSelectFile=${ie}
              onContextMenu=${be}
              onDragDrop=${Ot}
              selectedPath=${R}
              draftPaths=${p}
              isSearchActive=${K}
              searchActivePath=${h}
              creatingInFolder=${S}
              creatingType=${_}
              onCreationConfirm=${ce}
              onCreationCancel=${oe}
              dragSourcePath=${D}
            />
          `)}
        ${S===""&&_==="file"?Ge`
              <${Ka}
                key="__root-creation__"
                type="file"
                depth=${0}
                onConfirm=${ce}
                onCancel=${oe}
              />
            `:null}
        ${G.filter(H=>H.type!=="folder").map(H=>Ge`
            <${Ga}
              key=${H.path||H.name}
              node=${H}
              expandedPaths=${se}
              onSetFolderExpanded=${le}
              onSelectFolder=${ne}
              onRequestDelete=${xe}
              onSelectFile=${ie}
              onContextMenu=${be}
              onDragDrop=${Ot}
              selectedPath=${R}
              draftPaths=${p}
              isSearchActive=${K}
              searchActivePath=${h}
              creatingInFolder=${S}
              creatingType=${_}
              onCreationConfirm=${ce}
              onCreationCancel=${oe}
              dragSourcePath=${D}
            />
          `)}
      </ul>
      </div>
      ${A?Ge`
            <${zS}
              x=${A.x}
              y=${A.y}
              targetPath=${A.targetPath}
              targetType=${A.targetType}
              isLocked=${!!A.isLocked}
              onNewFile=${H=>V(H,"file")}
              onNewFolder=${H=>V(H,"folder")}
              onCopyPath=${kt}
              onDownload=${et}
              onDelete=${xe}
              onClose=${Ve}
            />
          `:null}
      <${st}
        visible=${!!x}
        title=${he?"Delete folder?":"Delete file?"}
        message=${he?`Delete folder ${x||"this folder"} and all its contents?`:`Delete ${x||"this file"}? This can be restored from diff view before sync.`}
        confirmLabel="Delete"
        confirmLoadingLabel="Deleting..."
        cancelLabel="Cancel"
        confirmTone="warning"
        confirmLoading=${w}
        confirmDisabled=${w}
        onCancel=${()=>{w||v("")}}
        onConfirm=${ue}
      />
    </div>
  `};var US=new Intl.NumberFormat("en-US"),KS=new Intl.NumberFormat("en-US",{notation:"compact",minimumFractionDigits:1,maximumFractionDigits:1}),GS=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:3}),Bd=(t,{valueIsUnixSeconds:e=!1,valueIsEpochMs:n=!1}={})=>t==null||t===""?null:t instanceof Date?t:e?new Date(Number(t)*1e3):n?new Date(Number(t)):new Date(t),qS=(t,e)=>t.getFullYear()===e.getFullYear()&&t.getMonth()===e.getMonth()&&t.getDate()===e.getDate(),Jt=t=>US.format(Number(t||0)),qa=t=>{let e=Number(t||0);return Number.isFinite(e)?Math.abs(e)<1e3?Jt(e):KS.format(e):"0"},Xb=t=>{let e=Number(t||0);if(!Number.isFinite(e)||e<=0)return"0 B";let n=["B","KB","MB","GB","TB"],s=0,o=e;for(;o>=1024&&s<n.length-1;)o/=1024,s+=1;let r=o>=100||s===0?0:o>=10?1:2;return`${o.toFixed(r)} ${n[s]}`},gn=t=>GS.format(Number(t||0)),Wo=(t,{fallback:e="\u2014",valueIsUnixSeconds:n=!1,valueIsEpochMs:s=!1}={})=>{try{let o=Bd(t,{valueIsUnixSeconds:n,valueIsEpochMs:s});return!o||Number.isNaN(o.getTime())?e:o.toLocaleString()}catch{return e}},Yn=(t,{fallback:e="\u2014",valueIsUnixSeconds:n=!1,valueIsEpochMs:s=!1}={})=>{try{let o=Bd(t,{valueIsUnixSeconds:n,valueIsEpochMs:s});return!o||Number.isNaN(o.getTime())?e:qS(o,new Date)?o.toLocaleTimeString():o.toLocaleString()}catch{return e}},bn=t=>{let e=Number(t||0);if(!Number.isFinite(e)||e<=0)return"0s";if(e<1e3)return`${Math.round(e)}ms`;let n=Math.round(e/1e3),s=Math.floor(n/60),o=n%60;return s<=0?`${o}s`:`${s}m ${o}s`},JS=(t="")=>{let n=String(t||"").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!n)return null;let s=Number.parseInt(n[1],10),o=Number.parseInt(n[2],10)-1,r=Number.parseInt(n[3],10);return!Number.isFinite(s)||!Number.isFinite(o)||!Number.isFinite(r)?null:new Date(s,o,r)},Xn=(t,{range:e="7d",valueType:n="epoch-ms"}={})=>{let s=null;if(n==="day-key")s=JS(t);else if(n==="epoch-ms"){let r=Number(t);s=Number.isFinite(r)?new Date(r):null}else s=Bd(t);if(!s||Number.isNaN(s.getTime()))return String(t??"");let o=String(e||"").trim().toLowerCase();return o==="24h"?s.toLocaleTimeString([],{hour:"numeric"}):o==="7d"?s.toLocaleDateString([],{weekday:"short",month:"numeric",day:"numeric"}):s.toLocaleDateString([],{month:"numeric",day:"numeric"})};var Wt=P.bind(T),ZS=1e4,YS=4,XS=12,QS=t=>Wo(t,{fallback:"",valueIsUnixSeconds:!0}),Qb=t=>{let e=String(t?.repoSlug||"").trim();return e||String(t?.repoPath||"").split("/").filter(Boolean).pop()||"repo"},eC=t=>{let e=String(t?.statusKind||"M").toUpperCase();return e==="U"?{statusLabel:"U",statusClass:"is-untracked",rowClass:"is-clickable",canOpen:!0}:e==="D"?{statusLabel:"D",statusClass:"is-deleted",rowClass:"is-clickable",canOpen:!0}:{statusLabel:"M",statusClass:"is-modified",rowClass:"is-clickable",canOpen:!0}},ex=(t,e)=>{if(t==null||t==="")return"";let n=Number(t);return!Number.isFinite(n)||n<=0?"":`${e}${n}`},tC=(t,e)=>{let n=String(t||"").trim(),s=String(e||"").toUpperCase();return n?n.endsWith("/")?!0:s==="U"&&n.endsWith("\\"):!1},nC=t=>{let e=String(t?.syncState||"").trim(),n=Number(t?.aheadCount)||0,s=Number(t?.behindCount)||0;return e==="ahead"?{label:"\u2191",title:`Ahead by ${n}`,className:"is-ahead"}:e==="behind"?{label:"\u2193",title:`Behind by ${s}`,className:"is-behind"}:e==="diverged"?{label:"\u2195",title:`Diverged (${n} ahead, ${s} behind)`,className:"is-diverged"}:e==="upstream-gone"?{label:"!",title:"Upstream missing",className:"is-upstream-gone"}:e==="no-upstream"||!t?.hasUpstream?{label:"!",title:"Not linked",className:"is-no-upstream"}:{label:"",title:"Up to date",className:"is-up-to-date"}},sC=t=>{let e=Array.isArray(t?.changedFiles)?t.changedFiles:[],n=Number(t?.changedFilesCount)||0,s=e.map(u=>String(u?.path||"").trim()).filter(Boolean),o=n||s.length;if(o<=0)return"sync changes";let r=s.map(u=>u.split("/").filter(Boolean).pop()||u),i=Array.from(new Set(r));if(i.length<=0)return`Edited ${o} ${o===1?"file":"files"}`;let a=i.slice(0,YS),l=Math.max(0,o-a.length),c=o===1?"file":"files",d=l>0?` +${l} more`:"";return`Edited ${o} ${c} - ${a.join(", ")}${d}`},tx=({onSelectFile:t=()=>{},isActive:e=!0})=>{let[n,s]=y(!0),[o,r]=y(!1),[i,a]=y(""),[l,c]=y(null);if(L(()=>{if(!e)return()=>{};let m=!0,h=null,b=async()=>{if(m)try{let v=await pd();if(!m)return;c(v),a("")}catch(v){if(!m)return;a(v.message||"Could not load git summary")}finally{m&&s(!1)}},x=()=>{b()};return b(),h=window.setInterval(b,ZS),window.addEventListener("alphaclaw:browse-file-saved",x),()=>{m=!1,h&&window.clearInterval(h),window.removeEventListener("alphaclaw:browse-file-saved",x)}},[e]),n)return Wt`
      <div class="sidebar-git-panel sidebar-git-loading" aria-label="Loading git summary">
        <${Ce} className="h-4 w-4" />
      </div>
    `;if(i)return Wt`<div class="sidebar-git-panel sidebar-git-panel-error">${i}</div>`;if(!l?.isRepo)return Wt`
      <div class="sidebar-git-panel">
        <div class="sidebar-git-meta">No git repo at this root</div>
      </div>
    `;let d=(l.changedFiles||[]).length>0,u=Number(l?.aheadCount)||0,p=d||u>0,f=nC(l),g=async()=>{if(!(!p||o))try{r(!0);let m=sC(l),h=await mg(m);h?.committed||h?.pushed?(window.dispatchEvent(new CustomEvent("alphaclaw:browse-git-synced")),N(h.message||"Changes synced","success")):N(h?.message||"No changes to sync","info");let b=await pd();c(b),a("")}catch(m){N(m.message||"Could not sync changes","error")}finally{r(!1)}};return Wt`
    <div class="sidebar-git-panel">
      <div class="sidebar-git-bar">
        ${l.repoUrl?Wt`
              <a
                class="sidebar-git-bar-main sidebar-git-link"
                href=${l.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                title=${l.repoUrl}
              >
                <${vd} className="sidebar-git-bar-icon" />
                <span class="sidebar-git-repo-name">${Qb(l)}</span>
              </a>
            `:Wt`
              <span class="sidebar-git-bar-main">
                <${vd} className="sidebar-git-bar-icon" />
                <span class="sidebar-git-repo-name">${Qb(l)}</span>
              </span>
            `}
      </div>
      <div class="sidebar-git-bar sidebar-git-bar-secondary">
        <span class="sidebar-git-bar-main">
          <${pb} className="sidebar-git-bar-icon" />
          <span class="sidebar-git-branch">${l.branch||"unknown"}</span>
        </span>
        ${f.label?Wt`
              <span
                class=${`sidebar-git-sync-status ${f.className}`.trim()}
                title=${f.title||""}
                aria-label=${f.title||""}
              >
                ${f.label}
              </span>
            `:null}
      </div>
      <div class="sidebar-git-scroll">
        ${(l.changedFiles||[]).length>0?Wt`
              <div class="sidebar-git-changes-label">
                ${`Unsynced Changes (${l.changedFilesCount||(l.changedFiles||[]).length})`}
              </div>
              <ul class="sidebar-git-changes-list">
                ${(l.changedFiles||[]).map(m=>{let h=eC(m),b=String(m?.path||""),x=ex(m?.addedLines,"+"),v=ex(m?.deletedLines,"-");return Wt`
                    <li
                      class=${`sidebar-git-change-row ${h.statusClass} ${h.rowClass}`.trim()}
                      title=${b}
                      onclick=${()=>{if(!h.canOpen||!b)return;if(tC(b,m?.statusKind)){t(b,{directory:!0,preservePreview:!0});return}t(b,{view:"diff"})}}
                    >
                      <span class="sidebar-git-change-path">${b}</span>
                      <span class="sidebar-git-change-meta">
                        ${x?Wt`<span class="sidebar-git-change-plus">${x}</span>`:null}
                        ${v?Wt`<span class="sidebar-git-change-minus">${v}</span>`:null}
                        <span class="sidebar-git-change-status">${h.statusLabel}</span>
                      </span>
                    </li>
                  `})}
              </ul>
              <div class="sidebar-git-actions">
                <${Z}
                  onClick=${g}
                  disabled=${!p}
                  loading=${o}
                  loadingMode="inline"
                  idleLabel="Sync Changes"
                  loadingLabel="Syncing..."
                  tone="primary"
                  size="sm"
                  className="sidebar-git-sync-button"
                />
              </div>
            `:null}
        ${(l.commits||[]).length>0?Wt`
              <div class="sidebar-git-changes-label">commit history</div>
              <ul class="sidebar-git-list">
                ${(l.commits||[]).slice(0,XS).map(m=>Wt`
                    <li title=${QS(m.timestamp)}>
                      ${m.url?Wt`
                            <a
                              class="sidebar-git-commit-link"
                              href=${m.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span class="sidebar-git-hash">${m.shortHash}</span>
                              <span>${m.message}</span>
                            </a>
                          `:Wt`
                            <span class="sidebar-git-hash">${m.shortHash}</span>
                            <span>${m.message}</span>
                          `}
                    </li>
                  `)}
              </ul>
            `:null}
      </div>
    </div>
  `};function Vd(){return{async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null}}var Qs=Vd();function lx(t){Qs=t}var ti={exec:()=>null};function Be(t,e=""){let n=typeof t=="string"?t:t.source,s={replace:(o,r)=>{let i=typeof r=="string"?r:r.source;return i=i.replace(Vt.caret,"$1"),n=n.replace(o,i),s},getRegex:()=>new RegExp(n,e)};return s}var oC=(()=>{try{return!!new RegExp("(?<=1)(?<!1)")}catch{return!1}})(),Vt={codeRemoveIndent:/^(?: {1,4}| {0,3}\t)/gm,outputLinkReplace:/\\([\[\]])/g,indentCodeCompensation:/^(\s+)(?:```)/,beginningSpace:/^\s+/,endingHash:/#$/,startingSpaceChar:/^ /,endingSpaceChar:/ $/,nonSpaceChar:/[^ ]/,newLineCharGlobal:/\n/g,tabCharGlobal:/\t/g,multipleSpaceGlobal:/\s+/g,blankLine:/^[ \t]*$/,doubleBlankLine:/\n[ \t]*\n[ \t]*$/,blockquoteStart:/^ {0,3}>/,blockquoteSetextReplace:/\n {0,3}((?:=+|-+) *)(?=\n|$)/g,blockquoteSetextReplace2:/^ {0,3}>[ \t]?/gm,listReplaceTabs:/^\t+/,listReplaceNesting:/^ {1,4}(?=( {4})*[^ ])/g,listIsTask:/^\[[ xX]\] /,listReplaceTask:/^\[[ xX]\] +/,anyLine:/\n.*\n/,hrefBrackets:/^<(.*)>$/,tableDelimiter:/[:|]/,tableAlignChars:/^\||\| *$/g,tableRowBlankLine:/\n[ \t]*$/,tableAlignRight:/^ *-+: *$/,tableAlignCenter:/^ *:-+: *$/,tableAlignLeft:/^ *:-+ *$/,startATag:/^<a /i,endATag:/^<\/a>/i,startPreScriptTag:/^<(pre|code|kbd|script)(\s|>)/i,endPreScriptTag:/^<\/(pre|code|kbd|script)(\s|>)/i,startAngleBracket:/^</,endAngleBracket:/>$/,pedanticHrefTitle:/^([^'"]*[^\s])\s+(['"])(.*)\2/,unicodeAlphaNumeric:/[\p{L}\p{N}]/u,escapeTest:/[&<>"']/,escapeReplace:/[&<>"']/g,escapeTestNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,escapeReplaceNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,unescapeTest:/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig,caret:/(^|[^\[])\^/g,percentDecode:/%25/g,findPipe:/\|/g,splitPipe:/ \|/,slashPipe:/\\\|/g,carriageReturn:/\r\n|\r/g,spaceLine:/^ +$/gm,notSpaceStart:/^\S*/,endingNewline:/\n$/,listItemRegex:t=>new RegExp(`^( {0,3}${t})((?:[	 ][^\\n]*)?(?:\\n|$))`),nextBulletRegex:t=>new RegExp(`^ {0,${Math.min(3,t-1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),hrRegex:t=>new RegExp(`^ {0,${Math.min(3,t-1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),fencesBeginRegex:t=>new RegExp(`^ {0,${Math.min(3,t-1)}}(?:\`\`\`|~~~)`),headingBeginRegex:t=>new RegExp(`^ {0,${Math.min(3,t-1)}}#`),htmlBeginRegex:t=>new RegExp(`^ {0,${Math.min(3,t-1)}}<(?:[a-z].*>|!--)`,"i")},rC=/^(?:[ \t]*(?:\n|$))+/,iC=/^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,aC=/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,ni=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,lC=/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,jd=/(?:[*+-]|\d{1,9}[.)])/,cx=/^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,dx=Be(cx).replace(/bull/g,jd).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/\|table/g,"").getRegex(),cC=Be(cx).replace(/bull/g,jd).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/table/g,/ {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(),zd=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,dC=/^[^\n]+/,Ud=/(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/,uC=Be(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label",Ud).replace("title",/(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),pC=Be(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g,jd).getRegex(),Qa="address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",Kd=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,fC=Be("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))","i").replace("comment",Kd).replace("tag",Qa).replace("attribute",/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),ux=Be(zd).replace("hr",ni).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("|table","").replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",Qa).getRegex(),hC=Be(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph",ux).getRegex(),Gd={blockquote:hC,code:iC,def:uC,fences:aC,heading:lC,hr:ni,html:fC,lheading:dx,list:pC,newline:rC,paragraph:ux,table:ti,text:dC},nx=Be("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr",ni).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("blockquote"," {0,3}>").replace("code","(?: {4}| {0,3}	)[^\\n]").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",Qa).getRegex(),mC={...Gd,lheading:cC,table:nx,paragraph:Be(zd).replace("hr",ni).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("table",nx).replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",Qa).getRegex()},gC={...Gd,html:Be(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment",Kd).replace(/tag/g,"(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:ti,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:Be(zd).replace("hr",ni).replace("heading",` *#{1,6} *[^
]`).replace("lheading",dx).replace("|table","").replace("blockquote"," {0,3}>").replace("|fences","").replace("|list","").replace("|html","").replace("|tag","").getRegex()},bC=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,xC=/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,px=/^( {2,}|\\)\n(?!\s*$)/,yC=/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,el=/[\p{P}\p{S}]/u,qd=/[\s\p{P}\p{S}]/u,fx=/[^\s\p{P}\p{S}]/u,vC=Be(/^((?![*_])punctSpace)/,"u").replace(/punctSpace/g,qd).getRegex(),hx=/(?!~)[\p{P}\p{S}]/u,$C=/(?!~)[\s\p{P}\p{S}]/u,wC=/(?:[^\s\p{P}\p{S}]|~)/u,kC=Be(/link|precode-code|html/,"g").replace("link",/\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-",oC?"(?<!`)()":"(^^|[^`])").replace("code",/(?<b>`+)[^`]+\k<b>(?!`)/).replace("html",/<(?! )[^<>]*?>/).getRegex(),mx=/^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/,SC=Be(mx,"u").replace(/punct/g,el).getRegex(),CC=Be(mx,"u").replace(/punct/g,hx).getRegex(),gx="^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)",_C=Be(gx,"gu").replace(/notPunctSpace/g,fx).replace(/punctSpace/g,qd).replace(/punct/g,el).getRegex(),MC=Be(gx,"gu").replace(/notPunctSpace/g,wC).replace(/punctSpace/g,$C).replace(/punct/g,hx).getRegex(),AC=Be("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)","gu").replace(/notPunctSpace/g,fx).replace(/punctSpace/g,qd).replace(/punct/g,el).getRegex(),TC=Be(/\\(punct)/,"gu").replace(/punct/g,el).getRegex(),PC=Be(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme",/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email",/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),RC=Be(Kd).replace("(?:-->|$)","-->").getRegex(),LC=Be("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment",RC).replace("attribute",/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),Za=/(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+[^`]*?`+(?!`)|[^\[\]\\`])*?/,EC=Be(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label",Za).replace("href",/<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title",/"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),bx=Be(/^!?\[(label)\]\[(ref)\]/).replace("label",Za).replace("ref",Ud).getRegex(),xx=Be(/^!?\[(ref)\](?:\[\])?/).replace("ref",Ud).getRegex(),IC=Be("reflink|nolink(?!\\()","g").replace("reflink",bx).replace("nolink",xx).getRegex(),sx=/[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,Jd={_backpedal:ti,anyPunctuation:TC,autolink:PC,blockSkip:kC,br:px,code:xC,del:ti,emStrongLDelim:SC,emStrongRDelimAst:_C,emStrongRDelimUnd:AC,escape:bC,link:EC,nolink:xx,punctuation:vC,reflink:bx,reflinkSearch:IC,tag:LC,text:yC,url:ti},DC={...Jd,link:Be(/^!?\[(label)\]\((.*?)\)/).replace("label",Za).getRegex(),reflink:Be(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label",Za).getRegex()},Fd={...Jd,emStrongRDelimAst:MC,emStrongLDelim:CC,url:Be(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol",sx).replace("email",/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,text:Be(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol",sx).getRegex()},NC={...Fd,br:Be(px).replace("{2,}","*").getRegex(),text:Be(Fd.text).replace("\\b_","\\b_| {2,}\\n").replace(/\{2,\}/g,"*").getRegex()},Ja={normal:Gd,gfm:mC,pedantic:gC},Xr={normal:Jd,gfm:Fd,breaks:NC,pedantic:DC},OC={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},ox=t=>OC[t];function Ln(t,e){if(e){if(Vt.escapeTest.test(t))return t.replace(Vt.escapeReplace,ox)}else if(Vt.escapeTestNoEncode.test(t))return t.replace(Vt.escapeReplaceNoEncode,ox);return t}function rx(t){try{t=encodeURI(t).replace(Vt.percentDecode,"%")}catch{return null}return t}function ix(t,e){let n=t.replace(Vt.findPipe,(r,i,a)=>{let l=!1,c=i;for(;--c>=0&&a[c]==="\\";)l=!l;return l?"|":" |"}),s=n.split(Vt.splitPipe),o=0;if(s[0].trim()||s.shift(),s.length>0&&!s.at(-1)?.trim()&&s.pop(),e)if(s.length>e)s.splice(e);else for(;s.length<e;)s.push("");for(;o<s.length;o++)s[o]=s[o].trim().replace(Vt.slashPipe,"|");return s}function Qr(t,e,n){let s=t.length;if(s===0)return"";let o=0;for(;o<s;){let r=t.charAt(s-o-1);if(r===e&&!n)o++;else if(r!==e&&n)o++;else break}return t.slice(0,s-o)}function BC(t,e){if(t.indexOf(e[1])===-1)return-1;let n=0;for(let s=0;s<t.length;s++)if(t[s]==="\\")s++;else if(t[s]===e[0])n++;else if(t[s]===e[1]&&(n--,n<0))return s;return n>0?-2:-1}function ax(t,e,n,s,o){let r=e.href,i=e.title||null,a=t[1].replace(o.other.outputLinkReplace,"$1");s.state.inLink=!0;let l={type:t[0].charAt(0)==="!"?"image":"link",raw:n,href:r,title:i,text:a,tokens:s.inlineTokens(a)};return s.state.inLink=!1,l}function FC(t,e,n){let s=t.match(n.other.indentCodeCompensation);if(s===null)return e;let o=s[1];return e.split(`
`).map(r=>{let i=r.match(n.other.beginningSpace);if(i===null)return r;let[a]=i;return a.length>=o.length?r.slice(o.length):r}).join(`
`)}var Ya=class{options;rules;lexer;constructor(t){this.options=t||Qs}space(t){let e=this.rules.block.newline.exec(t);if(e&&e[0].length>0)return{type:"space",raw:e[0]}}code(t){let e=this.rules.block.code.exec(t);if(e){let n=e[0].replace(this.rules.other.codeRemoveIndent,"");return{type:"code",raw:e[0],codeBlockStyle:"indented",text:this.options.pedantic?n:Qr(n,`
`)}}}fences(t){let e=this.rules.block.fences.exec(t);if(e){let n=e[0],s=FC(n,e[3]||"",this.rules);return{type:"code",raw:n,lang:e[2]?e[2].trim().replace(this.rules.inline.anyPunctuation,"$1"):e[2],text:s}}}heading(t){let e=this.rules.block.heading.exec(t);if(e){let n=e[2].trim();if(this.rules.other.endingHash.test(n)){let s=Qr(n,"#");(this.options.pedantic||!s||this.rules.other.endingSpaceChar.test(s))&&(n=s.trim())}return{type:"heading",raw:e[0],depth:e[1].length,text:n,tokens:this.lexer.inline(n)}}}hr(t){let e=this.rules.block.hr.exec(t);if(e)return{type:"hr",raw:Qr(e[0],`
`)}}blockquote(t){let e=this.rules.block.blockquote.exec(t);if(e){let n=Qr(e[0],`
`).split(`
`),s="",o="",r=[];for(;n.length>0;){let i=!1,a=[],l;for(l=0;l<n.length;l++)if(this.rules.other.blockquoteStart.test(n[l]))a.push(n[l]),i=!0;else if(!i)a.push(n[l]);else break;n=n.slice(l);let c=a.join(`
`),d=c.replace(this.rules.other.blockquoteSetextReplace,`
    $1`).replace(this.rules.other.blockquoteSetextReplace2,"");s=s?`${s}
${c}`:c,o=o?`${o}
${d}`:d;let u=this.lexer.state.top;if(this.lexer.state.top=!0,this.lexer.blockTokens(d,r,!0),this.lexer.state.top=u,n.length===0)break;let p=r.at(-1);if(p?.type==="code")break;if(p?.type==="blockquote"){let f=p,g=f.raw+`
`+n.join(`
`),m=this.blockquote(g);r[r.length-1]=m,s=s.substring(0,s.length-f.raw.length)+m.raw,o=o.substring(0,o.length-f.text.length)+m.text;break}else if(p?.type==="list"){let f=p,g=f.raw+`
`+n.join(`
`),m=this.list(g);r[r.length-1]=m,s=s.substring(0,s.length-p.raw.length)+m.raw,o=o.substring(0,o.length-f.raw.length)+m.raw,n=g.substring(r.at(-1).raw.length).split(`
`);continue}}return{type:"blockquote",raw:s,tokens:r,text:o}}}list(t){let e=this.rules.block.list.exec(t);if(e){let n=e[1].trim(),s=n.length>1,o={type:"list",raw:"",ordered:s,start:s?+n.slice(0,-1):"",loose:!1,items:[]};n=s?`\\d{1,9}\\${n.slice(-1)}`:`\\${n}`,this.options.pedantic&&(n=s?n:"[*+-]");let r=this.rules.other.listItemRegex(n),i=!1;for(;t;){let l=!1,c="",d="";if(!(e=r.exec(t))||this.rules.block.hr.test(t))break;c=e[0],t=t.substring(c.length);let u=e[2].split(`
`,1)[0].replace(this.rules.other.listReplaceTabs,b=>" ".repeat(3*b.length)),p=t.split(`
`,1)[0],f=!u.trim(),g=0;if(this.options.pedantic?(g=2,d=u.trimStart()):f?g=e[1].length+1:(g=e[2].search(this.rules.other.nonSpaceChar),g=g>4?1:g,d=u.slice(g),g+=e[1].length),f&&this.rules.other.blankLine.test(p)&&(c+=p+`
`,t=t.substring(p.length+1),l=!0),!l){let b=this.rules.other.nextBulletRegex(g),x=this.rules.other.hrRegex(g),v=this.rules.other.fencesBeginRegex(g),w=this.rules.other.headingBeginRegex(g),$=this.rules.other.htmlBeginRegex(g);for(;t;){let S=t.split(`
`,1)[0],C;if(p=S,this.options.pedantic?(p=p.replace(this.rules.other.listReplaceNesting,"  "),C=p):C=p.replace(this.rules.other.tabCharGlobal,"    "),v.test(p)||w.test(p)||$.test(p)||b.test(p)||x.test(p))break;if(C.search(this.rules.other.nonSpaceChar)>=g||!p.trim())d+=`
`+C.slice(g);else{if(f||u.replace(this.rules.other.tabCharGlobal,"    ").search(this.rules.other.nonSpaceChar)>=4||v.test(u)||w.test(u)||x.test(u))break;d+=`
`+p}!f&&!p.trim()&&(f=!0),c+=S+`
`,t=t.substring(S.length+1),u=C.slice(g)}}o.loose||(i?o.loose=!0:this.rules.other.doubleBlankLine.test(c)&&(i=!0));let m=null,h;this.options.gfm&&(m=this.rules.other.listIsTask.exec(d),m&&(h=m[0]!=="[ ] ",d=d.replace(this.rules.other.listReplaceTask,""))),o.items.push({type:"list_item",raw:c,task:!!m,checked:h,loose:!1,text:d,tokens:[]}),o.raw+=c}let a=o.items.at(-1);if(a)a.raw=a.raw.trimEnd(),a.text=a.text.trimEnd();else return;o.raw=o.raw.trimEnd();for(let l=0;l<o.items.length;l++)if(this.lexer.state.top=!1,o.items[l].tokens=this.lexer.blockTokens(o.items[l].text,[]),!o.loose){let c=o.items[l].tokens.filter(u=>u.type==="space"),d=c.length>0&&c.some(u=>this.rules.other.anyLine.test(u.raw));o.loose=d}if(o.loose)for(let l=0;l<o.items.length;l++)o.items[l].loose=!0;return o}}html(t){let e=this.rules.block.html.exec(t);if(e)return{type:"html",block:!0,raw:e[0],pre:e[1]==="pre"||e[1]==="script"||e[1]==="style",text:e[0]}}def(t){let e=this.rules.block.def.exec(t);if(e){let n=e[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal," "),s=e[2]?e[2].replace(this.rules.other.hrefBrackets,"$1").replace(this.rules.inline.anyPunctuation,"$1"):"",o=e[3]?e[3].substring(1,e[3].length-1).replace(this.rules.inline.anyPunctuation,"$1"):e[3];return{type:"def",tag:n,raw:e[0],href:s,title:o}}}table(t){let e=this.rules.block.table.exec(t);if(!e||!this.rules.other.tableDelimiter.test(e[2]))return;let n=ix(e[1]),s=e[2].replace(this.rules.other.tableAlignChars,"").split("|"),o=e[3]?.trim()?e[3].replace(this.rules.other.tableRowBlankLine,"").split(`
`):[],r={type:"table",raw:e[0],header:[],align:[],rows:[]};if(n.length===s.length){for(let i of s)this.rules.other.tableAlignRight.test(i)?r.align.push("right"):this.rules.other.tableAlignCenter.test(i)?r.align.push("center"):this.rules.other.tableAlignLeft.test(i)?r.align.push("left"):r.align.push(null);for(let i=0;i<n.length;i++)r.header.push({text:n[i],tokens:this.lexer.inline(n[i]),header:!0,align:r.align[i]});for(let i of o)r.rows.push(ix(i,r.header.length).map((a,l)=>({text:a,tokens:this.lexer.inline(a),header:!1,align:r.align[l]})));return r}}lheading(t){let e=this.rules.block.lheading.exec(t);if(e)return{type:"heading",raw:e[0],depth:e[2].charAt(0)==="="?1:2,text:e[1],tokens:this.lexer.inline(e[1])}}paragraph(t){let e=this.rules.block.paragraph.exec(t);if(e){let n=e[1].charAt(e[1].length-1)===`
`?e[1].slice(0,-1):e[1];return{type:"paragraph",raw:e[0],text:n,tokens:this.lexer.inline(n)}}}text(t){let e=this.rules.block.text.exec(t);if(e)return{type:"text",raw:e[0],text:e[0],tokens:this.lexer.inline(e[0])}}escape(t){let e=this.rules.inline.escape.exec(t);if(e)return{type:"escape",raw:e[0],text:e[1]}}tag(t){let e=this.rules.inline.tag.exec(t);if(e)return!this.lexer.state.inLink&&this.rules.other.startATag.test(e[0])?this.lexer.state.inLink=!0:this.lexer.state.inLink&&this.rules.other.endATag.test(e[0])&&(this.lexer.state.inLink=!1),!this.lexer.state.inRawBlock&&this.rules.other.startPreScriptTag.test(e[0])?this.lexer.state.inRawBlock=!0:this.lexer.state.inRawBlock&&this.rules.other.endPreScriptTag.test(e[0])&&(this.lexer.state.inRawBlock=!1),{type:"html",raw:e[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:!1,text:e[0]}}link(t){let e=this.rules.inline.link.exec(t);if(e){let n=e[2].trim();if(!this.options.pedantic&&this.rules.other.startAngleBracket.test(n)){if(!this.rules.other.endAngleBracket.test(n))return;let r=Qr(n.slice(0,-1),"\\");if((n.length-r.length)%2===0)return}else{let r=BC(e[2],"()");if(r===-2)return;if(r>-1){let i=(e[0].indexOf("!")===0?5:4)+e[1].length+r;e[2]=e[2].substring(0,r),e[0]=e[0].substring(0,i).trim(),e[3]=""}}let s=e[2],o="";if(this.options.pedantic){let r=this.rules.other.pedanticHrefTitle.exec(s);r&&(s=r[1],o=r[3])}else o=e[3]?e[3].slice(1,-1):"";return s=s.trim(),this.rules.other.startAngleBracket.test(s)&&(this.options.pedantic&&!this.rules.other.endAngleBracket.test(n)?s=s.slice(1):s=s.slice(1,-1)),ax(e,{href:s&&s.replace(this.rules.inline.anyPunctuation,"$1"),title:o&&o.replace(this.rules.inline.anyPunctuation,"$1")},e[0],this.lexer,this.rules)}}reflink(t,e){let n;if((n=this.rules.inline.reflink.exec(t))||(n=this.rules.inline.nolink.exec(t))){let s=(n[2]||n[1]).replace(this.rules.other.multipleSpaceGlobal," "),o=e[s.toLowerCase()];if(!o){let r=n[0].charAt(0);return{type:"text",raw:r,text:r}}return ax(n,o,n[0],this.lexer,this.rules)}}emStrong(t,e,n=""){let s=this.rules.inline.emStrongLDelim.exec(t);if(!(!s||s[3]&&n.match(this.rules.other.unicodeAlphaNumeric))&&(!(s[1]||s[2])||!n||this.rules.inline.punctuation.exec(n))){let o=[...s[0]].length-1,r,i,a=o,l=0,c=s[0][0]==="*"?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd;for(c.lastIndex=0,e=e.slice(-1*t.length+o);(s=c.exec(e))!=null;){if(r=s[1]||s[2]||s[3]||s[4]||s[5]||s[6],!r)continue;if(i=[...r].length,s[3]||s[4]){a+=i;continue}else if((s[5]||s[6])&&o%3&&!((o+i)%3)){l+=i;continue}if(a-=i,a>0)continue;i=Math.min(i,i+a+l);let d=[...s[0]][0].length,u=t.slice(0,o+s.index+d+i);if(Math.min(o,i)%2){let f=u.slice(1,-1);return{type:"em",raw:u,text:f,tokens:this.lexer.inlineTokens(f)}}let p=u.slice(2,-2);return{type:"strong",raw:u,text:p,tokens:this.lexer.inlineTokens(p)}}}}codespan(t){let e=this.rules.inline.code.exec(t);if(e){let n=e[2].replace(this.rules.other.newLineCharGlobal," "),s=this.rules.other.nonSpaceChar.test(n),o=this.rules.other.startingSpaceChar.test(n)&&this.rules.other.endingSpaceChar.test(n);return s&&o&&(n=n.substring(1,n.length-1)),{type:"codespan",raw:e[0],text:n}}}br(t){let e=this.rules.inline.br.exec(t);if(e)return{type:"br",raw:e[0]}}del(t){let e=this.rules.inline.del.exec(t);if(e)return{type:"del",raw:e[0],text:e[2],tokens:this.lexer.inlineTokens(e[2])}}autolink(t){let e=this.rules.inline.autolink.exec(t);if(e){let n,s;return e[2]==="@"?(n=e[1],s="mailto:"+n):(n=e[1],s=n),{type:"link",raw:e[0],text:n,href:s,tokens:[{type:"text",raw:n,text:n}]}}}url(t){let e;if(e=this.rules.inline.url.exec(t)){let n,s;if(e[2]==="@")n=e[0],s="mailto:"+n;else{let o;do o=e[0],e[0]=this.rules.inline._backpedal.exec(e[0])?.[0]??"";while(o!==e[0]);n=e[0],e[1]==="www."?s="http://"+e[0]:s=e[0]}return{type:"link",raw:e[0],text:n,href:s,tokens:[{type:"text",raw:n,text:n}]}}}inlineText(t){let e=this.rules.inline.text.exec(t);if(e){let n=this.lexer.state.inRawBlock;return{type:"text",raw:e[0],text:e[0],escaped:n}}}},xn=class Hd{tokens;options;state;tokenizer;inlineQueue;constructor(e){this.tokens=[],this.tokens.links=Object.create(null),this.options=e||Qs,this.options.tokenizer=this.options.tokenizer||new Ya,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:!1,inRawBlock:!1,top:!0};let n={other:Vt,block:Ja.normal,inline:Xr.normal};this.options.pedantic?(n.block=Ja.pedantic,n.inline=Xr.pedantic):this.options.gfm&&(n.block=Ja.gfm,this.options.breaks?n.inline=Xr.breaks:n.inline=Xr.gfm),this.tokenizer.rules=n}static get rules(){return{block:Ja,inline:Xr}}static lex(e,n){return new Hd(n).lex(e)}static lexInline(e,n){return new Hd(n).inlineTokens(e)}lex(e){e=e.replace(Vt.carriageReturn,`
`),this.blockTokens(e,this.tokens);for(let n=0;n<this.inlineQueue.length;n++){let s=this.inlineQueue[n];this.inlineTokens(s.src,s.tokens)}return this.inlineQueue=[],this.tokens}blockTokens(e,n=[],s=!1){for(this.options.pedantic&&(e=e.replace(Vt.tabCharGlobal,"    ").replace(Vt.spaceLine,""));e;){let o;if(this.options.extensions?.block?.some(i=>(o=i.call({lexer:this},e,n))?(e=e.substring(o.raw.length),n.push(o),!0):!1))continue;if(o=this.tokenizer.space(e)){e=e.substring(o.raw.length);let i=n.at(-1);o.raw.length===1&&i!==void 0?i.raw+=`
`:n.push(o);continue}if(o=this.tokenizer.code(e)){e=e.substring(o.raw.length);let i=n.at(-1);i?.type==="paragraph"||i?.type==="text"?(i.raw+=(i.raw.endsWith(`
`)?"":`
`)+o.raw,i.text+=`
`+o.text,this.inlineQueue.at(-1).src=i.text):n.push(o);continue}if(o=this.tokenizer.fences(e)){e=e.substring(o.raw.length),n.push(o);continue}if(o=this.tokenizer.heading(e)){e=e.substring(o.raw.length),n.push(o);continue}if(o=this.tokenizer.hr(e)){e=e.substring(o.raw.length),n.push(o);continue}if(o=this.tokenizer.blockquote(e)){e=e.substring(o.raw.length),n.push(o);continue}if(o=this.tokenizer.list(e)){e=e.substring(o.raw.length),n.push(o);continue}if(o=this.tokenizer.html(e)){e=e.substring(o.raw.length),n.push(o);continue}if(o=this.tokenizer.def(e)){e=e.substring(o.raw.length);let i=n.at(-1);i?.type==="paragraph"||i?.type==="text"?(i.raw+=(i.raw.endsWith(`
`)?"":`
`)+o.raw,i.text+=`
`+o.raw,this.inlineQueue.at(-1).src=i.text):this.tokens.links[o.tag]||(this.tokens.links[o.tag]={href:o.href,title:o.title},n.push(o));continue}if(o=this.tokenizer.table(e)){e=e.substring(o.raw.length),n.push(o);continue}if(o=this.tokenizer.lheading(e)){e=e.substring(o.raw.length),n.push(o);continue}let r=e;if(this.options.extensions?.startBlock){let i=1/0,a=e.slice(1),l;this.options.extensions.startBlock.forEach(c=>{l=c.call({lexer:this},a),typeof l=="number"&&l>=0&&(i=Math.min(i,l))}),i<1/0&&i>=0&&(r=e.substring(0,i+1))}if(this.state.top&&(o=this.tokenizer.paragraph(r))){let i=n.at(-1);s&&i?.type==="paragraph"?(i.raw+=(i.raw.endsWith(`
`)?"":`
`)+o.raw,i.text+=`
`+o.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=i.text):n.push(o),s=r.length!==e.length,e=e.substring(o.raw.length);continue}if(o=this.tokenizer.text(e)){e=e.substring(o.raw.length);let i=n.at(-1);i?.type==="text"?(i.raw+=(i.raw.endsWith(`
`)?"":`
`)+o.raw,i.text+=`
`+o.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=i.text):n.push(o);continue}if(e){let i="Infinite loop on byte: "+e.charCodeAt(0);if(this.options.silent){console.error(i);break}else throw new Error(i)}}return this.state.top=!0,n}inline(e,n=[]){return this.inlineQueue.push({src:e,tokens:n}),n}inlineTokens(e,n=[]){let s=e,o=null;if(this.tokens.links){let l=Object.keys(this.tokens.links);if(l.length>0)for(;(o=this.tokenizer.rules.inline.reflinkSearch.exec(s))!=null;)l.includes(o[0].slice(o[0].lastIndexOf("[")+1,-1))&&(s=s.slice(0,o.index)+"["+"a".repeat(o[0].length-2)+"]"+s.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex))}for(;(o=this.tokenizer.rules.inline.anyPunctuation.exec(s))!=null;)s=s.slice(0,o.index)+"++"+s.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);let r;for(;(o=this.tokenizer.rules.inline.blockSkip.exec(s))!=null;)r=o[2]?o[2].length:0,s=s.slice(0,o.index+r)+"["+"a".repeat(o[0].length-r-2)+"]"+s.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);s=this.options.hooks?.emStrongMask?.call({lexer:this},s)??s;let i=!1,a="";for(;e;){i||(a=""),i=!1;let l;if(this.options.extensions?.inline?.some(d=>(l=d.call({lexer:this},e,n))?(e=e.substring(l.raw.length),n.push(l),!0):!1))continue;if(l=this.tokenizer.escape(e)){e=e.substring(l.raw.length),n.push(l);continue}if(l=this.tokenizer.tag(e)){e=e.substring(l.raw.length),n.push(l);continue}if(l=this.tokenizer.link(e)){e=e.substring(l.raw.length),n.push(l);continue}if(l=this.tokenizer.reflink(e,this.tokens.links)){e=e.substring(l.raw.length);let d=n.at(-1);l.type==="text"&&d?.type==="text"?(d.raw+=l.raw,d.text+=l.text):n.push(l);continue}if(l=this.tokenizer.emStrong(e,s,a)){e=e.substring(l.raw.length),n.push(l);continue}if(l=this.tokenizer.codespan(e)){e=e.substring(l.raw.length),n.push(l);continue}if(l=this.tokenizer.br(e)){e=e.substring(l.raw.length),n.push(l);continue}if(l=this.tokenizer.del(e)){e=e.substring(l.raw.length),n.push(l);continue}if(l=this.tokenizer.autolink(e)){e=e.substring(l.raw.length),n.push(l);continue}if(!this.state.inLink&&(l=this.tokenizer.url(e))){e=e.substring(l.raw.length),n.push(l);continue}let c=e;if(this.options.extensions?.startInline){let d=1/0,u=e.slice(1),p;this.options.extensions.startInline.forEach(f=>{p=f.call({lexer:this},u),typeof p=="number"&&p>=0&&(d=Math.min(d,p))}),d<1/0&&d>=0&&(c=e.substring(0,d+1))}if(l=this.tokenizer.inlineText(c)){e=e.substring(l.raw.length),l.raw.slice(-1)!=="_"&&(a=l.raw.slice(-1)),i=!0;let d=n.at(-1);d?.type==="text"?(d.raw+=l.raw,d.text+=l.text):n.push(l);continue}if(e){let d="Infinite loop on byte: "+e.charCodeAt(0);if(this.options.silent){console.error(d);break}else throw new Error(d)}}return n}},Xa=class{options;parser;constructor(t){this.options=t||Qs}space(t){return""}code({text:t,lang:e,escaped:n}){let s=(e||"").match(Vt.notSpaceStart)?.[0],o=t.replace(Vt.endingNewline,"")+`
`;return s?'<pre><code class="language-'+Ln(s)+'">'+(n?o:Ln(o,!0))+`</code></pre>
`:"<pre><code>"+(n?o:Ln(o,!0))+`</code></pre>
`}blockquote({tokens:t}){return`<blockquote>
${this.parser.parse(t)}</blockquote>
`}html({text:t}){return t}def(t){return""}heading({tokens:t,depth:e}){return`<h${e}>${this.parser.parseInline(t)}</h${e}>
`}hr(t){return`<hr>
`}list(t){let e=t.ordered,n=t.start,s="";for(let i=0;i<t.items.length;i++){let a=t.items[i];s+=this.listitem(a)}let o=e?"ol":"ul",r=e&&n!==1?' start="'+n+'"':"";return"<"+o+r+`>
`+s+"</"+o+`>
`}listitem(t){let e="";if(t.task){let n=this.checkbox({checked:!!t.checked});t.loose?t.tokens[0]?.type==="paragraph"?(t.tokens[0].text=n+" "+t.tokens[0].text,t.tokens[0].tokens&&t.tokens[0].tokens.length>0&&t.tokens[0].tokens[0].type==="text"&&(t.tokens[0].tokens[0].text=n+" "+Ln(t.tokens[0].tokens[0].text),t.tokens[0].tokens[0].escaped=!0)):t.tokens.unshift({type:"text",raw:n+" ",text:n+" ",escaped:!0}):e+=n+" "}return e+=this.parser.parse(t.tokens,!!t.loose),`<li>${e}</li>
`}checkbox({checked:t}){return"<input "+(t?'checked="" ':"")+'disabled="" type="checkbox">'}paragraph({tokens:t}){return`<p>${this.parser.parseInline(t)}</p>
`}table(t){let e="",n="";for(let o=0;o<t.header.length;o++)n+=this.tablecell(t.header[o]);e+=this.tablerow({text:n});let s="";for(let o=0;o<t.rows.length;o++){let r=t.rows[o];n="";for(let i=0;i<r.length;i++)n+=this.tablecell(r[i]);s+=this.tablerow({text:n})}return s&&(s=`<tbody>${s}</tbody>`),`<table>
<thead>
`+e+`</thead>
`+s+`</table>
`}tablerow({text:t}){return`<tr>
${t}</tr>
`}tablecell(t){let e=this.parser.parseInline(t.tokens),n=t.header?"th":"td";return(t.align?`<${n} align="${t.align}">`:`<${n}>`)+e+`</${n}>
`}strong({tokens:t}){return`<strong>${this.parser.parseInline(t)}</strong>`}em({tokens:t}){return`<em>${this.parser.parseInline(t)}</em>`}codespan({text:t}){return`<code>${Ln(t,!0)}</code>`}br(t){return"<br>"}del({tokens:t}){return`<del>${this.parser.parseInline(t)}</del>`}link({href:t,title:e,tokens:n}){let s=this.parser.parseInline(n),o=rx(t);if(o===null)return s;t=o;let r='<a href="'+t+'"';return e&&(r+=' title="'+Ln(e)+'"'),r+=">"+s+"</a>",r}image({href:t,title:e,text:n,tokens:s}){s&&(n=this.parser.parseInline(s,this.parser.textRenderer));let o=rx(t);if(o===null)return Ln(n);t=o;let r=`<img src="${t}" alt="${n}"`;return e&&(r+=` title="${Ln(e)}"`),r+=">",r}text(t){return"tokens"in t&&t.tokens?this.parser.parseInline(t.tokens):"escaped"in t&&t.escaped?t.text:Ln(t.text)}},Zd=class{strong({text:t}){return t}em({text:t}){return t}codespan({text:t}){return t}del({text:t}){return t}html({text:t}){return t}text({text:t}){return t}link({text:t}){return""+t}image({text:t}){return""+t}br(){return""}},yn=class Wd{options;renderer;textRenderer;constructor(e){this.options=e||Qs,this.options.renderer=this.options.renderer||new Xa,this.renderer=this.options.renderer,this.renderer.options=this.options,this.renderer.parser=this,this.textRenderer=new Zd}static parse(e,n){return new Wd(n).parse(e)}static parseInline(e,n){return new Wd(n).parseInline(e)}parse(e,n=!0){let s="";for(let o=0;o<e.length;o++){let r=e[o];if(this.options.extensions?.renderers?.[r.type]){let a=r,l=this.options.extensions.renderers[a.type].call({parser:this},a);if(l!==!1||!["space","hr","heading","code","table","blockquote","list","html","def","paragraph","text"].includes(a.type)){s+=l||"";continue}}let i=r;switch(i.type){case"space":{s+=this.renderer.space(i);continue}case"hr":{s+=this.renderer.hr(i);continue}case"heading":{s+=this.renderer.heading(i);continue}case"code":{s+=this.renderer.code(i);continue}case"table":{s+=this.renderer.table(i);continue}case"blockquote":{s+=this.renderer.blockquote(i);continue}case"list":{s+=this.renderer.list(i);continue}case"html":{s+=this.renderer.html(i);continue}case"def":{s+=this.renderer.def(i);continue}case"paragraph":{s+=this.renderer.paragraph(i);continue}case"text":{let a=i,l=this.renderer.text(a);for(;o+1<e.length&&e[o+1].type==="text";)a=e[++o],l+=`
`+this.renderer.text(a);n?s+=this.renderer.paragraph({type:"paragraph",raw:l,text:l,tokens:[{type:"text",raw:l,text:l,escaped:!0}]}):s+=l;continue}default:{let a='Token with "'+i.type+'" type was not found.';if(this.options.silent)return console.error(a),"";throw new Error(a)}}}return s}parseInline(e,n=this.renderer){let s="";for(let o=0;o<e.length;o++){let r=e[o];if(this.options.extensions?.renderers?.[r.type]){let a=this.options.extensions.renderers[r.type].call({parser:this},r);if(a!==!1||!["escape","html","link","image","strong","em","codespan","br","del","text"].includes(r.type)){s+=a||"";continue}}let i=r;switch(i.type){case"escape":{s+=n.text(i);break}case"html":{s+=n.html(i);break}case"link":{s+=n.link(i);break}case"image":{s+=n.image(i);break}case"strong":{s+=n.strong(i);break}case"em":{s+=n.em(i);break}case"codespan":{s+=n.codespan(i);break}case"br":{s+=n.br(i);break}case"del":{s+=n.del(i);break}case"text":{s+=n.text(i);break}default:{let a='Token with "'+i.type+'" type was not found.';if(this.options.silent)return console.error(a),"";throw new Error(a)}}}return s}},ei=class{options;block;constructor(t){this.options=t||Qs}static passThroughHooks=new Set(["preprocess","postprocess","processAllTokens","emStrongMask"]);static passThroughHooksRespectAsync=new Set(["preprocess","postprocess","processAllTokens"]);preprocess(t){return t}postprocess(t){return t}processAllTokens(t){return t}emStrongMask(t){return t}provideLexer(){return this.block?xn.lex:xn.lexInline}provideParser(){return this.block?yn.parse:yn.parseInline}},HC=class{defaults=Vd();options=this.setOptions;parse=this.parseMarkdown(!0);parseInline=this.parseMarkdown(!1);Parser=yn;Renderer=Xa;TextRenderer=Zd;Lexer=xn;Tokenizer=Ya;Hooks=ei;constructor(...t){this.use(...t)}walkTokens(t,e){let n=[];for(let s of t)switch(n=n.concat(e.call(this,s)),s.type){case"table":{let o=s;for(let r of o.header)n=n.concat(this.walkTokens(r.tokens,e));for(let r of o.rows)for(let i of r)n=n.concat(this.walkTokens(i.tokens,e));break}case"list":{let o=s;n=n.concat(this.walkTokens(o.items,e));break}default:{let o=s;this.defaults.extensions?.childTokens?.[o.type]?this.defaults.extensions.childTokens[o.type].forEach(r=>{let i=o[r].flat(1/0);n=n.concat(this.walkTokens(i,e))}):o.tokens&&(n=n.concat(this.walkTokens(o.tokens,e)))}}return n}use(...t){let e=this.defaults.extensions||{renderers:{},childTokens:{}};return t.forEach(n=>{let s={...n};if(s.async=this.defaults.async||s.async||!1,n.extensions&&(n.extensions.forEach(o=>{if(!o.name)throw new Error("extension name required");if("renderer"in o){let r=e.renderers[o.name];r?e.renderers[o.name]=function(...i){let a=o.renderer.apply(this,i);return a===!1&&(a=r.apply(this,i)),a}:e.renderers[o.name]=o.renderer}if("tokenizer"in o){if(!o.level||o.level!=="block"&&o.level!=="inline")throw new Error("extension level must be 'block' or 'inline'");let r=e[o.level];r?r.unshift(o.tokenizer):e[o.level]=[o.tokenizer],o.start&&(o.level==="block"?e.startBlock?e.startBlock.push(o.start):e.startBlock=[o.start]:o.level==="inline"&&(e.startInline?e.startInline.push(o.start):e.startInline=[o.start]))}"childTokens"in o&&o.childTokens&&(e.childTokens[o.name]=o.childTokens)}),s.extensions=e),n.renderer){let o=this.defaults.renderer||new Xa(this.defaults);for(let r in n.renderer){if(!(r in o))throw new Error(`renderer '${r}' does not exist`);if(["options","parser"].includes(r))continue;let i=r,a=n.renderer[i],l=o[i];o[i]=(...c)=>{let d=a.apply(o,c);return d===!1&&(d=l.apply(o,c)),d||""}}s.renderer=o}if(n.tokenizer){let o=this.defaults.tokenizer||new Ya(this.defaults);for(let r in n.tokenizer){if(!(r in o))throw new Error(`tokenizer '${r}' does not exist`);if(["options","rules","lexer"].includes(r))continue;let i=r,a=n.tokenizer[i],l=o[i];o[i]=(...c)=>{let d=a.apply(o,c);return d===!1&&(d=l.apply(o,c)),d}}s.tokenizer=o}if(n.hooks){let o=this.defaults.hooks||new ei;for(let r in n.hooks){if(!(r in o))throw new Error(`hook '${r}' does not exist`);if(["options","block"].includes(r))continue;let i=r,a=n.hooks[i],l=o[i];ei.passThroughHooks.has(r)?o[i]=c=>{if(this.defaults.async&&ei.passThroughHooksRespectAsync.has(r))return(async()=>{let u=await a.call(o,c);return l.call(o,u)})();let d=a.call(o,c);return l.call(o,d)}:o[i]=(...c)=>{if(this.defaults.async)return(async()=>{let u=await a.apply(o,c);return u===!1&&(u=await l.apply(o,c)),u})();let d=a.apply(o,c);return d===!1&&(d=l.apply(o,c)),d}}s.hooks=o}if(n.walkTokens){let o=this.defaults.walkTokens,r=n.walkTokens;s.walkTokens=function(i){let a=[];return a.push(r.call(this,i)),o&&(a=a.concat(o.call(this,i))),a}}this.defaults={...this.defaults,...s}}),this}setOptions(t){return this.defaults={...this.defaults,...t},this}lexer(t,e){return xn.lex(t,e??this.defaults)}parser(t,e){return yn.parse(t,e??this.defaults)}parseMarkdown(t){return(e,n)=>{let s={...n},o={...this.defaults,...s},r=this.onError(!!o.silent,!!o.async);if(this.defaults.async===!0&&s.async===!1)return r(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));if(typeof e>"u"||e===null)return r(new Error("marked(): input parameter is undefined or null"));if(typeof e!="string")return r(new Error("marked(): input parameter is of type "+Object.prototype.toString.call(e)+", string expected"));if(o.hooks&&(o.hooks.options=o,o.hooks.block=t),o.async)return(async()=>{let i=o.hooks?await o.hooks.preprocess(e):e,a=await(o.hooks?await o.hooks.provideLexer():t?xn.lex:xn.lexInline)(i,o),l=o.hooks?await o.hooks.processAllTokens(a):a;o.walkTokens&&await Promise.all(this.walkTokens(l,o.walkTokens));let c=await(o.hooks?await o.hooks.provideParser():t?yn.parse:yn.parseInline)(l,o);return o.hooks?await o.hooks.postprocess(c):c})().catch(r);try{o.hooks&&(e=o.hooks.preprocess(e));let i=(o.hooks?o.hooks.provideLexer():t?xn.lex:xn.lexInline)(e,o);o.hooks&&(i=o.hooks.processAllTokens(i)),o.walkTokens&&this.walkTokens(i,o.walkTokens);let a=(o.hooks?o.hooks.provideParser():t?yn.parse:yn.parseInline)(i,o);return o.hooks&&(a=o.hooks.postprocess(a)),a}catch(i){return r(i)}}}onError(t,e){return n=>{if(n.message+=`
Please report this to https://github.com/markedjs/marked.`,t){let s="<p>An error occurred:</p><pre>"+Ln(n.message+"",!0)+"</pre>";return e?Promise.resolve(s):s}if(e)return Promise.reject(n);throw n}}},Xs=new HC;function Le(t,e){return Xs.parse(t,e)}Le.options=Le.setOptions=function(t){return Xs.setOptions(t),Le.defaults=Xs.defaults,lx(Le.defaults),Le};Le.getDefaults=Vd;Le.defaults=Qs;Le.use=function(...t){return Xs.use(...t),Le.defaults=Xs.defaults,lx(Le.defaults),Le};Le.walkTokens=function(t,e){return Xs.walkTokens(t,e)};Le.parseInline=Xs.parseInline;Le.Parser=yn;Le.parser=yn.parse;Le.Renderer=Xa;Le.TextRenderer=Zd;Le.Lexer=xn;Le.lexer=xn.lex;Le.Tokenizer=Ya;Le.Hooks=ei;Le.parse=Le;var LD=Le.options,ED=Le.setOptions,ID=Le.use,DD=Le.walkTokens,ND=Le.parseInline;var OD=yn.parse,BD=xn.lex;var Vo=P.bind(T),WC=t=>{let e=String(t||"").trim();return e?e.startsWith("v")?e:`v${e}`:""},VC=t=>{let e=Date.parse(String(t||""));if(!Number.isFinite(e))return"";try{return new Intl.DateTimeFormat(void 0,{dateStyle:"medium",timeStyle:"short"}).format(new Date(e))}catch{return""}},jC=t=>t?`https://github.com/chrysb/alphaclaw/releases/tag/${encodeURIComponent(t)}`:"https://github.com/chrysb/alphaclaw/releases",yx=({visible:t=!1,onClose:e=()=>{},version:n="",onUpdate:s=()=>{},updating:o=!1})=>{let r=F(()=>WC(n),[n]),[i,a]=y(!1),[l,c]=y(""),[d,u]=y(null);L(()=>{if(!t)return;let x=!0;return(async()=>{a(!0),c("");try{let w=await bm(r);if(!x)return;if(!w?.ok){c(w?.error||"Could not load release notes"),u(null);return}u(w)}catch(w){if(!x)return;c(w?.message||"Could not load release notes"),u(null)}finally{if(!x)return;a(!1)}})(),()=>{x=!1}},[t,r]);let p=String(d?.tag||r||"").trim(),f=String(d?.htmlUrl||"").trim()||jC(p),g=p?`Update to ${p}`:"Update now",m=VC(d?.publishedAt),h=String(d?.body||"").trim(),b=F(()=>Le.parse(h,{gfm:!0,breaks:!0}),[h]);return Vo`
    <${De}
      visible=${t}
      onClose=${e}
      panelClassName="relative bg-modal border border-border rounded-xl p-5 w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col gap-4"
    >
      <button
        type="button"
        onclick=${e}
        class="absolute top-5 right-5 h-8 w-8 inline-flex items-center justify-center rounded-lg ac-btn-secondary"
        aria-label="Close modal"
      >
        <${nt} className="w-3.5 h-3.5 text-body" />
      </button>
      <div class="space-y-1 pr-10">
        <h3 class="text-sm font-semibold">AlphaClaw release notes</h3>
        ${m?Vo`<p class="text-xs text-fg-muted">Published ${m}</p>`:null}
      </div>
      <div class="ac-surface-inset border border-border rounded-lg p-2 overflow-auto min-h-[220px] max-h-[66vh]">
        ${i?Vo`
              <div class="min-h-[200px] flex items-center justify-center text-fg-muted">
                <span class="inline-flex items-center gap-2 text-sm">
                  <${Ce} className="h-4 w-4" />
                  Loading release notes...
                </span>
              </div>
            `:l?Vo`
                <div class="space-y-2">
                  <p class="text-sm text-status-error">${l}</p>
                  <a
                    class="ac-tip-link text-xs"
                    href=${f}
                    target="_blank"
                    rel="noreferrer"
                    >View release on GitHub</a
                  >
                </div>
              `:h?Vo`<div
                  class="file-viewer-preview release-notes-preview"
                  dangerouslySetInnerHTML=${{__html:b}}
                ></div>`:Vo`
                  <div class="space-y-2">
                    <p class="text-sm text-body">No release notes were published for this tag.</p>
                    <a
                      class="ac-tip-link text-xs"
                      href=${f}
                      target="_blank"
                      rel="noreferrer"
                      >Open release on GitHub</a
                    >
                  </div>
                `}
      </div>
      <div class="flex items-center justify-end gap-2 pt-1">
        <${Z}
          onClick=${e}
          tone="ghost"
          idleLabel="Later"
          disabled=${o}
        />
        <${Z}
          onClick=${s}
          tone="warning"
          idleLabel=${g}
          loadingLabel="Updating..."
          loading=${o}
          disabled=${i}
        />
      </div>
    </${De}>
  `};var zC=t=>{if(!t)return{};try{let e=JSON.parse(t);return e&&typeof e=="object"?e:{}}catch{return{}}},Fe=()=>{try{let t=window.localStorage.getItem(Cd);return zC(t)}catch{return{}}},Ct=t=>{try{window.localStorage.setItem(Cd,JSON.stringify(t&&typeof t=="object"?t:{}))}catch{}},vx=t=>{let e=Fe(),n=t(e);return Ct(n),n};var En=P.bind(T),Sx="browseBottomPanelHeightPx",UC=120,$x=120,KC=6,wx=260,GC={cron:Ta,usage:db,doctor:bb,watchdog:xb,models:_a,envars:Ma,webhooks:ub,nodes:Pa},qC=()=>{try{let t=Fe(),e=Number.parseInt(String(t?.[Sx]||""),10);return Number.isFinite(e)&&e>0?e:wx}catch{return wx}},kx=({item:t,selectedNavId:e,onSelectNavItem:n})=>{let s=GC[t.id]||null;return En`
    <a
      class=${e===t.id?"active":""}
      onclick=${()=>n(t.id)}
    >
      ${s?En`<${s} className="sidebar-nav-icon" />`:null}
      <span>${t.label}</span>
    </a>
  `},JC=t=>String(t?.identity?.emoji||"").trim(),Cx=({mobileSidebarOpen:t=!1,authEnabled:e=!1,menuRef:n=null,menuOpen:s=!1,onToggleMenu:o=()=>{},onLogout:r=()=>{},sidebarTab:i="menu",onSelectSidebarTab:a=()=>{},navSections:l=[],selectedNavId:c="",onSelectNavItem:d=()=>{},selectedBrowsePath:u="",onSelectBrowseFile:p=()=>{},onPreviewBrowseFile:f=()=>{},acHasUpdate:g=!1,acLatest:m="",acUpdating:h=!1,onAcUpdate:b=()=>{},agents:x=[],selectedAgentId:v="",onSelectAgent:w=()=>{},onAddAgent:$=()=>{}})=>{let S=ee(null),C=ee(null),_=ee({startY:0,startHeight:0}),[k,A]=y(qC),[O,D]=y(!1),[z,E]=y(!1);L(()=>{let W=Fe();W[Sx]=k,Ct(W)},[k]);let M=W=>{let G=S.current;if(!G)return W;let se=G.getBoundingClientRect(),K=Math.max($x,se.height-UC-KC);return Math.max($x,Math.min(K,W))},R=W=>{let{startY:G,startHeight:se}=_.current,K=se+(G-W);A(M(K))};L(()=>{let W=S.current;if(!W||typeof ResizeObserver>"u")return()=>{};let G=new ResizeObserver(()=>{W.getBoundingClientRect().height<=0||A(K=>M(K))});return G.observe(W),()=>G.disconnect()},[]),L(()=>{if(!O)return()=>{};let W=se=>R(se.clientY),G=()=>D(!1);return window.addEventListener("pointermove",W),window.addEventListener("pointerup",G),()=>{window.removeEventListener("pointermove",W),window.removeEventListener("pointerup",G)}},[O]);let B=W=>{W.preventDefault();let G=C.current?.getBoundingClientRect().height||k;_.current={startY:W.clientY,startHeight:G},A(M(G)),D(!0)},I=l.find(W=>W.label==="Setup")||null,U=l.filter(W=>W.label!=="Setup");return En`
    <div class=${`app-sidebar ${t?"mobile-open":""}`}>
    <div class="sidebar-brand">
      <img src="./img/logo.svg" alt="" width="20" height="20" />
      <span><span style="color: var(--accent)">alpha</span>claw</span>
      ${e&&En`
        <${pt}
          open=${s}
          onToggle=${o}
          onClose=${o}
          ariaLabel="Menu"
          title="Menu"
          menuRef=${n}
        >
          <${We} onClick=${()=>r()}>
            Log out
          </${We}>
        </${pt}>
      `}
    </div>
    <div class="sidebar-tabs">
      <button
        class=${`sidebar-tab ${i==="menu"?"active":""}`}
        aria-label="Menu tab"
        title="Menu"
        onclick=${()=>a("menu")}
      >
        <${Jg} className="sidebar-tab-icon" />
      </button>
      <button
        class=${`sidebar-tab ${i==="browse"?"active":""}`}
        aria-label="Browse tab"
        title="Browse"
        onclick=${()=>a("browse")}
      >
        <${Zg} className="sidebar-tab-icon" />
      </button>
    </div>
    <div
      style=${{display:i==="menu"?"flex":"none",flexDirection:"column",flex:"1 1 auto",minHeight:0}}
    >
      ${I?En`
            <div class="sidebar-label">Menu</div>
            <nav class="sidebar-nav">
              ${I.items.map(W=>kx({item:W,selectedNavId:c,onSelectNavItem:d}))}
            </nav>
          `:null}
      <div class="sidebar-agents-header">
        <div class="sidebar-label sidebar-agents-label">Agents</div>
        <button
          type="button"
          class="sidebar-agents-add-button"
          onclick=${$}
          title="Add agent"
          aria-label="Add agent"
        >
          <${No} className="sidebar-agents-add-icon" />
        </button>
      </div>
      <div class="sidebar-agents-list">
        ${x.map(W=>{let G=JC(W);return En`
              <button
                key=${W.id}
                class=${`sidebar-agent-item ${v===W.id?"active":""}`}
                onclick=${()=>w(W.id)}
              >
                ${G?En`<span class="sidebar-agent-emoji" aria-hidden="true">${G}</span>`:En`<${Yg} className="sidebar-agent-icon" />`}
                <span class="sidebar-agent-name">${W.name||W.id}</span>
              </button>
            `})}
      </div>
      ${U.map(W=>En`
          <div class="sidebar-label">${W.label}</div>
          <nav class="sidebar-nav">
            ${W.items.map(G=>kx({item:G,selectedNavId:c,onSelectNavItem:d}))}
          </nav>
        `)}
      <div class="sidebar-footer">
        ${g&&m?En`
              <${tn}
                onClick=${()=>E(!0)}
                loading=${h}
                warning=${!0}
                idleLabel=${`Update to v${m}`}
                loadingLabel="Updating..."
                className="w-full justify-center"
              />
            `:null}
      </div>
    </div>
    <div
      style=${{display:i==="browse"?"flex":"none",flexDirection:"column",flex:"1 1 auto",minHeight:0,overflow:"hidden"}}
    >
      <div class="sidebar-browse-layout" ref=${S}>
        <div
          class="sidebar-browse-panel"
        >
          <${Yb}
            onSelectFile=${p}
            selectedPath=${u}
            onPreviewFile=${f}
            isActive=${i==="browse"}
          />
        </div>
        <div
          class=${`sidebar-browse-resizer ${O?"is-resizing":""}`}
          onpointerdown=${B}
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize browse and git panels"
        ></div>
        <div class="sidebar-browse-bottom">
          <div
            class="sidebar-browse-bottom-inner"
            ref=${C}
            style=${{height:`${k}px`}}
          >
          <${tx}
            onSelectFile=${p}
            isActive=${i==="browse"}
          />
          </div>
        </div>
      </div>
    </div>
    <${yx}
      visible=${z}
      onClose=${()=>{h||E(!1)}}
      version=${m}
      onUpdate=${b}
      updating=${h}
    />
  </div>
`};var _x=P.bind(T),ZC="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",YC="border-cyan-500/40 bg-cyan-500/10 text-status-info shadow-[0_0_0_1px_rgba(34,211,238,0.08)]",XC="border-border bg-field text-fg-muted hover:border-fg-muted hover:text-body",Mx=({tabs:t=[],activeTab:e="",onSelectTab:n=()=>{},className:s="flex items-center gap-2"}={})=>_x`
  <div class=${s}>
    ${t.map(o=>_x`
        <button
          key=${String(o?.value||"")}
          type="button"
          class=${`${ZC} ${e===o?.value?YC:XC}`}
          onclick=${()=>n(o?.value)}
        >
          ${String(o?.label||o?.value||"")}
        </button>
      `)}
  </div>
`;var QC=P.bind(T),e2=260,t2=200,Qn=({visible:t=!1,className:e="",children:n})=>{let[s,o]=y(t?"visible":"hidden"),r=ee(null),i=ee(null);return L(()=>(clearTimeout(r.current),clearTimeout(i.current),t?s!=="visible"&&(o("entering"),r.current=setTimeout(()=>o("visible"),e2)):s!=="hidden"&&(o("exiting"),i.current=setTimeout(()=>o("hidden"),t2)),()=>{clearTimeout(r.current),clearTimeout(i.current)}),[t,s]),QC`
    <div class=${`ac-pop-actions ${s==="entering"?"ac-pop-actions-in":s==="exiting"?"ac-pop-actions-out":s==="visible"?"ac-pop-actions-visible":"ac-pop-actions-hidden"} ${e}`.trim()}>
      ${n}
    </div>
  `};var nn=P.bind(T),n2=({item:t={},menuOpenId:e="",setMenuOpenId:n=()=>{},openDeleteChannelDialog:s=()=>{},openEditChannelModal:o=()=>{},requestBindAccount:r=()=>{},onSetLocation:i=()=>{}})=>{let{accountData:a={},accountId:l="",accountStatusInfo:c={},canNavigateToOwnerAgent:d=!1,channel:u="",ownerAgentId:p="",ownerAgentName:f="",isAvailable:g=!1,isOwned:m=!1}=t,h=null;m?h=c?.status==="paired"?nn`<${Ks}
            status=${c?.status}
            ownerAgentName=${f}
            showAgentBadge=${!0}
            channelId=${u}
            pairedCount=${c?.paired??0}
          />`:nn`<${Ks}
            status=${c?.status}
            ownerAgentName=""
            showAgentBadge=${!1}
            channelId=${u}
            pairedCount=${c?.paired??0}
          />`:g?h=nn`
      <button
        type="button"
        onclick=${v=>{v.stopPropagation(),r(a)}}
        class="text-xs px-2 py-1 rounded-lg ac-btn-ghost"
      >
        Bind
      </button>
    `:h=nn`
      ${d?nn`
            <button
              type="button"
              class="inline-flex rounded-full transition-[filter] hover:brightness-125 focus:outline-none focus:ring-1 focus:ring-border"
              onclick=${v=>{v.stopPropagation(),i(`/agents/${encodeURIComponent(p)}`)}}
              title=${`Open ${f}`}
              aria-label=${`Open ${f}`}
            >
              <${ae} tone="neutral">${f}</${ae}>
            </button>
          `:nn`<${ae} tone="neutral">${f||"Bound elsewhere"}</${ae}>`}
    `;let b=a.isBoundElsewhere,x=!a.isBoundElsewhere;return nn`
    <div class="flex items-center gap-1.5">
      ${h}
      <${pt}
        open=${e===`${u}:${l}`}
        ariaLabel="Open channel actions"
        title="Open channel actions"
        onClose=${()=>n("")}
        onToggle=${()=>n(v=>v===`${u}:${l}`?"":`${u}:${l}`)}
      >
        ${x?nn`
              <${We}
                onClick=${()=>o(a)}
              >
                Edit
              </${We}>
            `:null}
        ${b?nn`
              <${We}
                onClick=${()=>r(a)}
              >
                Bind
              </${We}>
            `:null}
        ${x?nn`
              <${We}
                className="text-status-error hover:text-status-error"
                onClick=${()=>s(a)}
              >
                Delete
              </${We}>
            `:null}
      </${pt}>
    </div>
  `},Ax=({item:t={},channelMeta:e={},menuOpenId:n="",setMenuOpenId:s=()=>{},openDeleteChannelDialog:o=()=>{},openEditChannelModal:r=()=>{},requestBindAccount:i=()=>{},onSetLocation:a=()=>{}})=>{let l=!!t?.canOpenWorkspace,c=String(t?.accountId||"").trim()||"default";return nn`
    <div
      key=${t.id||t.channel}
      class="flex justify-between items-center py-1.5 ${l?"cursor-pointer hover:bg-surface -mx-2 px-2 rounded-lg transition-colors":""}"
      onclick=${l?()=>a(`/telegram/${encodeURIComponent(c)}`):void 0}
    >
      <span class="font-medium text-sm flex items-center gap-2 min-w-0">
        ${e?.iconSrc?nn`
              <img
                src=${e.iconSrc}
                alt=""
                class="w-4 h-4 rounded-sm"
                aria-hidden="true"
              />
            `:null}
        <span class="truncate ${t?.dimmedLabel?"text-fg-muted":""} ${t?.labelClassName||""}">
          ${t?.label||e?.label||"Channel"}
        </span>
        ${l?nn`
              <span class="text-xs text-fg-muted ml-1 shrink-0">Workspace</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                class="text-fg-dim shrink-0"
              >
                <path
                  d="M6 3.5L10.5 8L6 12.5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            `:null}
      </span>
      <span class="flex items-center gap-2 shrink-0">
        <${n2}
          item=${t}
          menuOpenId=${n}
          setMenuOpenId=${s}
          openDeleteChannelDialog=${o}
          openEditChannelModal=${r}
          requestBindAccount=${i}
          onSetLocation=${a}
        />
      </span>
    </div>
  `};var si=t=>{window.dispatchEvent(new CustomEvent("alphaclaw:agent-bindings-changed",{detail:{agentId:String(t||"").trim()}}))},Tx=()=>{window.dispatchEvent(new CustomEvent("alphaclaw:restart-required"))};var Yd=(t={})=>t.isAwaitingPairing?99:t.isOwned?0:t.isUnconfigured?3:t.isAvailable?1:2,s2=({statusInfo:t,accountId:e})=>{let n=String(e||"").trim()||"default",s=t?.accounts&&typeof t.accounts=="object"?t.accounts:null;return s?.[n]?s[n]:n==="default"&&t?t:null},Px=({account:t,statusInfo:e,accountId:n})=>{let s=String(t?.status||"").trim();return s?{status:s,paired:Number(t?.paired||0)}:s2({statusInfo:e,accountId:n})};var Rx=({accountId:t,boundAgentId:e,agentId:n,isDefaultAgent:s})=>{let o=String(e||"").trim();return o?o===String(n||"").trim():gs({accountId:t,boundAgentId:e})?!!s:!0};var Lx=({agent:t={},agents:e=[]})=>{let[n,s]=y([]),[o,r]=y({}),[i,a]=y(!0),[l,c]=y(!1),[d,u]=y("Creating..."),[p,f]=y(!1),[g,m]=y(""),[h,b]=y(""),[x,v]=y(null),[w,$]=y(null),[S,C]=y(null),_=String(t?.id||"").trim(),k=!!t?.default,A=F(()=>String(e.find(K=>K?.default)?.id||"").trim(),[e]),O=F(()=>new Map(e.map(K=>[String(K?.id||"").trim(),String(K?.name||"").trim()||String(K?.id||"").trim()])),[e]),D=q(async({includeStatus:K=!0}={})=>{a(!0);try{let j=[To(),K?So():Promise.resolve(null)],[X,de]=await Promise.all(j);s(Array.isArray(X?.channels)?X.channels:[]),K&&de&&r(de?.channels||{})}finally{a(!1)}},[]);L(()=>{_&&D().catch(()=>{})},[_,D]),L(()=>{let K=j=>{let X=String(j?.detail?.agentId||"").trim();X&&X!==_||D({includeStatus:!0}).catch(()=>{})};return window.addEventListener("alphaclaw:pairings-changed",K),()=>{window.removeEventListener("alphaclaw:pairings-changed",K)}},[_,D]);let z=F(()=>n.filter(K=>String(K?.channel||"").trim()&&Array.isArray(K?.accounts)&&K.accounts.length>0),[n]),E=F(()=>new Map(z.map(K=>[String(K.channel||"").trim(),K])),[z]),M=(K="")=>{b(""),m(String(K||"").trim()),f(!0)},R=K=>{b(""),v(K)},B=K=>{b(""),$(K)},I=async K=>{c(!0),u("Creating...");try{let j=await Ea({payload:K,onPhase:X=>{u(String(X||"").trim()||"Creating...")}});si(String(j?.binding?.agentId||K.agentId||"").trim()),N("Channel added","success"),await D({includeStatus:!1}),f(!1),m("")}catch(j){N(j.message||"Could not add channel","error")}finally{c(!1),u("Creating...")}},U=async K=>{c(!0);try{let j=await Fr(K);v(null),si(String(K.agentId||"").trim()),N("Channel updated","success"),j?.restartRequired&&Tx(),await D()}catch(j){N(j.message||"Could not update channel","error")}finally{c(!1)}},W=async()=>{if(w){c(!0);try{await $a({provider:w.provider,accountId:w.id}),$(null),si(_),N("Channel deleted","success"),await D({includeStatus:!1})}catch(K){N(K.message||"Could not delete channel","error")}finally{c(!1)}}},G=async K=>{if(K){c(!0);try{await Fr({provider:K.provider,accountId:K.id,name:K.name,agentId:_}),b(""),C(null),si(_),N("Channel bound","success"),await D()}catch(j){N(j.message||"Could not bind channel","error")}finally{c(!1)}}};return{agentId:_,agentNameMap:O,channelStatus:o,channels:n,configuredChannelMap:E,configuredChannels:z,createLoadingLabel:d,createProvider:g,defaultAgentId:A,deletingAccount:w,editingAccount:x,handleCreateChannel:I,handleDeleteChannel:W,handleQuickBind:G,handleUpdateChannel:U,isDefaultAgent:k,loading:i,menuOpenId:h,openCreateChannelModal:M,openDeleteChannelDialog:B,openEditChannelModal:R,pendingBindAccount:S,requestBindAccount:K=>{if(!K)return;let j=String(K?.ownerAgentId||"").trim(),X=String(K?.ownerAgentName||"").trim();if(j&&j!==_&&X){b(""),C(K);return}G(K)},saving:l,setCreateProvider:m,setDeletingAccount:$,setEditingAccount:v,setMenuOpenId:b,setPendingBindAccount:C,setShowCreateModal:f,showCreateModal:p}};var Ex=P.bind(T),Ix=({agentId:t="",agentNameMap:e=new Map,channelStatus:n={},configuredChannelMap:s=new Map,configuredChannels:o=[],defaultAgentId:r="",isDefaultAgent:i=!1})=>{let[a,l]=y(!1),c=F(()=>{let f=new Map(o.map((h,b)=>[String(h?.channel||"").trim(),b])),g=new Map(o.flatMap(h=>(Array.isArray(h?.accounts)?h.accounts:[]).map((b,x)=>[`${String(h?.channel||"").trim()}:${String(b?.id||"").trim()||"default"}`,x])));return Array.from(new Set([...o.map(h=>String(h.channel||"").trim())])).filter(Boolean).flatMap(h=>{let b=s.get(h),x=n?.[h]||null,v=Array.isArray(b?.accounts)?b.accounts:[];return!b&&!x?[]:v.map(w=>{let $=String(w?.id||"").trim()||"default",S=String(w?.boundAgentId||"").trim(),C=Px({account:w,statusInfo:x,accountId:$}),_=i&&gs({accountId:$,boundAgentId:S}),k=S===t||_,A=!i&&gs({accountId:$,boundAgentId:S}),O=Rx({accountId:$,boundAgentId:S,agentId:t,isDefaultAgent:i}),D=S||(gs({accountId:$,boundAgentId:S})?r:""),z=String(e.get(D)||D||"").trim(),E=!!D&&D!==t&&!!z,M=h==="telegram"&&k&&C?.status==="paired",R={id:$,provider:h,name:qs({channelId:h,account:w}),rawName:String(w?.name||"").trim(),ownerAgentId:D,ownerAgentName:z,boundAgentId:S,isOwned:k,envKey:String(w?.envKey||"").trim(),token:String(w?.token||"").trim(),isAvailable:O,isBoundElsewhere:!k&&(!O||A||!!D)};return{id:`${h}:${$}`,channel:h,accountId:$,channelOrder:Number(f.get(h)??9999),accountOrder:Number(g.get(`${h}:${$}`)??9999),label:qs({channelId:h,account:w}),isAwaitingPairing:C?.status!=="paired",canOpenWorkspace:M,canNavigateToOwnerAgent:E,ownerAgentId:D,ownerAgentName:z,accountStatusInfo:C,accountData:R,isOwned:k,isAvailable:O,dimmedLabel:R.isBoundElsewhere,isBoundElsewhere:R.isBoundElsewhere}})}).filter(Boolean).sort((h,b)=>{let x=Yd(h)-Yd(b);if(x!==0)return x;let v=Number(h?.channelOrder??9999)-Number(b?.channelOrder??9999);if(v!==0)return v;let w=Number(h?.accountOrder??9999)-Number(b?.accountOrder??9999);return w!==0?w:String(h?.label||"").localeCompare(String(b?.label||""))})},[t,e,n,s,o,r,i]),d=c.filter(f=>!f?.isBoundElsewhere),u=c.filter(f=>!!f?.isBoundElsewhere);return L(()=>{if(u.length===0){l(!1);return}d.length===0&&l(!0)},[t,u.length,d.length]),{mergedChannelItems:F(()=>{let f=[...d];return u.length===0||(f.push({id:"__assigned_elsewhere_toggle",label:Ex`
        <span class="inline-flex items-center gap-1.5">
          <span class=${`arrow inline-block ${a?"":"-rotate-90"}`}>▼</span>
          <span>Assigned elsewhere</span>
        </span>
      `,labelClassName:"text-xs",clickable:!0,onClick:()=>l(g=>!g),dimmedLabel:!0,trailing:Ex`
        <span class="inline-flex items-center gap-1.5 text-fg-muted">
          <span class="text-[11px] px-2 py-0.5 rounded-full border border-border">
            ${u.length}
          </span>
        </span>
      `}),a&&f.push(...u)),f},[u,a,d])}};var eo=P.bind(T),Dx=({agent:t={},agents:e=[],onSetLocation:n=()=>{}})=>{let{agentId:s,agentNameMap:o,channelStatus:r,channels:i,configuredChannelMap:a,configuredChannels:l,createLoadingLabel:c,createProvider:d,defaultAgentId:u,deletingAccount:p,editingAccount:f,handleCreateChannel:g,handleDeleteChannel:m,handleQuickBind:h,handleUpdateChannel:b,isDefaultAgent:x,loading:v,menuOpenId:w,openCreateChannelModal:$,openDeleteChannelDialog:S,openEditChannelModal:C,pendingBindAccount:_,requestBindAccount:k,saving:A,setCreateProvider:O,setDeletingAccount:D,setEditingAccount:z,setMenuOpenId:E,setPendingBindAccount:M,setShowCreateModal:R,showCreateModal:B}=Lx({agent:t,agents:e}),{mergedChannelItems:I}=Ix({agentId:s,agentNameMap:o,channelStatus:r,configuredChannelMap:a,configuredChannels:l,defaultAgentId:u,isDefaultAgent:x});return eo`
    <div class="space-y-3">
      ${v?eo`
            <${Oa}
              title="Channels"
              items=${[]}
              loadingLabel="Loading channels..."
              actions=${eo`
                <div class="relative">
                  <${Z}
                    onClick=${()=>{}}
                    disabled=${!0}
                    tone="subtle"
                    size="sm"
                    idleIcon=${No}
                    idleIconClassName="h-3.5 w-3.5"
                    iconOnly=${!0}
                    title="Add channel"
                    ariaLabel="Add channel"
                    idleLabel="Add channel"
                  />
                </div>
              `}
            />
          `:eo`
            <div class="space-y-3">
              <${Oa}
                title="Channels"
                items=${I}
                loadingLabel="No channels assigned to this agent."
                renderItem=${({item:U,channelMeta:W})=>String(U?.id||"").trim()==="__assigned_elsewhere_toggle"?null:eo`<${Ax}
                    item=${U}
                    channelMeta=${W}
                    menuOpenId=${w}
                    setMenuOpenId=${E}
                    openDeleteChannelDialog=${S}
                    openEditChannelModal=${C}
                    requestBindAccount=${k}
                    onSetLocation=${n}
                  />`}
                actions=${eo`
                  <${Ra}
                    open=${w==="__create_channel"}
                    onClose=${()=>E("")}
                    onToggle=${()=>E(U=>U==="__create_channel"?"":"__create_channel")}
                    triggerDisabled=${A}
                    channelIds=${bs}
                    getChannelMeta=${Lt}
                    isChannelDisabled=${U=>Ia({configuredChannelMap:a,provider:U})}
                    onSelectChannel=${$}
                  />
                `}
              />
            </div>
          `}
      <${qr}
        visible=${B}
        loading=${A}
        createLoadingLabel=${c}
        agents=${e}
        existingChannels=${i}
        initialAgentId=${s}
        initialProvider=${d}
        onClose=${()=>{R(!1),O("")}}
        onSubmit=${g}
      />
      <${qr}
        visible=${!!f}
        loading=${A}
        agents=${e}
        existingChannels=${i}
        mode="edit"
        account=${f}
        initialAgentId=${String(f?.ownerAgentId||s||"").trim()}
        initialProvider=${String(f?.provider||"").trim()}
        onClose=${()=>z(null)}
        onSubmit=${b}
      />
      <${st}
        visible=${!!_}
        title=${`Bind ${String(_?.name||"this channel").trim()} to ${String(t?.name||s).trim()}?`}
        message=""
        details=${_?eo`
              <p class="text-xs text-fg-muted">
                This will remove access for ${String(_?.ownerAgentName||"the other agent").trim()} to this channel.
              </p>
            `:null}
        confirmLabel="Bind channel"
        confirmLoadingLabel="Binding..."
        confirmTone="warning"
        confirmLoading=${A}
        onConfirm=${()=>h(_)}
        onCancel=${()=>{A||M(null)}}
      />
      <${st}
        visible=${!!p}
        title="Delete channel?"
        message=${`Remove ${String(p?.name||"this channel").trim()} from your configured channels?`}
        confirmLabel="Delete"
        confirmLoadingLabel="Deleting..."
        confirmTone="warning"
        confirmLoading=${A}
        onConfirm=${m}
        onCancel=${()=>{A||D(null)}}
      />
    </div>
  `};var ys=P.bind(T),o2=({p:t,onApprove:e,onReject:n})=>{let[s,o]=y(null),r=async d=>{o(d);try{d==="approve"?await e(t.id,t.channel,t.accountId):await n(t.id,t.channel,t.accountId)}catch{o(null)}},i=(t.channel||"unknown").charAt(0).toUpperCase()+(t.channel||"").slice(1),a=String(t.accountId||"").trim(),l=String(t.accountName||"").trim(),c=a&&a!=="default"?` \xB7 ${l||a}`:"";return s==="approve"?ys`
      <div class="bg-field rounded-lg p-3 mb-2 flex items-center gap-2">
        <span class="text-status-success text-sm">Approved</span>
        <span class="text-fg-muted text-xs">${i}${c} · ${t.code||t.id||"?"}</span>
      </div>`:s==="reject"?ys`
      <div class="bg-field rounded-lg p-3 mb-2 flex items-center gap-2">
        <span class="text-fg-muted text-sm">Rejected</span>
        <span class="text-fg-muted text-xs">${i}${c} · ${t.code||t.id||"?"}</span>
      </div>`:ys`
    <div class="bg-field rounded-lg p-3 mb-2">
      <div class="font-medium text-sm mb-2">${i}${c} · <code class="text-fg-muted">${t.code||t.id||"?"}</code></div>
      <div class="flex gap-2">
        <${Z}
          onClick=${()=>r("approve")}
          tone="success"
          size="sm"
          idleLabel="Approve"
          className="font-medium px-3 py-1.5"
        />
        <${Z}
          onClick=${()=>r("reject")}
          tone="secondary"
          size="sm"
          idleLabel="Reject"
          className="font-medium px-3 py-1.5"
        />
      </div>
    </div>`},r2=["telegram","discord","slack"],i2=t=>t.charAt(0).toUpperCase()+t.slice(1);function tl({pending:t,channels:e,visible:n,onApprove:s,onReject:o,statusRefreshing:r=!1}){if(!n)return null;let i=r2.filter(l=>{let c=e?.[l];if(!c)return!1;let d=c.accounts&&typeof c.accounts=="object"?c.accounts:{};return Object.keys(d).length>0?Object.values(d).some(u=>u&&u.status!=="paired"):c.status!=="paired"}).map(i2),a=i.length<=2?i.join(" or "):i.slice(0,-1).join(", ")+", or "+i[i.length-1];return ys`
    <div class="bg-surface border border-border rounded-xl p-4">
      <h2 class="card-label mb-3">Pending Pairings</h2>
      ${t.length>0?ys`<div>
            ${t.map(l=>ys`<${o2} key=${l.id} p=${l} onApprove=${s} onReject=${o} />`)}
          </div>`:r?ys`<div class="text-center py-4 space-y-2">
            <p class="text-body text-sm">Updating pairing status...</p>
          </div>`:ys`<div class="text-center py-4 space-y-2">
            <div class="text-3xl">💬</div>
            <p class="text-body text-sm">Send a message to your bot on ${a}</p>
            <p class="text-fg-dim text-xs">The pairing request will appear here — it may take a few moments</p>
          </div>`}
    </div>`}var Nx=P.bind(T),to=(t,e)=>{let n=String(t||"").trim(),s=String(e||"").trim()||"default";return n?`${n}:${s}`:""},a2=t=>{window.dispatchEvent(new CustomEvent("alphaclaw:pairings-changed",{detail:{agentId:String(t||"").trim()}}))},Ox=({agent:t={}})=>{let[e,n]=y([]),[s,o]=y([]),[r,i]=y(!0),[a,l]=y(!1),c=ee(null),d=ee([]),u=String(t?.id||"").trim(),p=!!t?.default,{data:f,loading:g,refresh:m}=ct(`/api/agents/${encodeURIComponent(String(u||""))}/bindings`,()=>Gm(t.id),{enabled:!!u,maxAgeMs:3e4}),{data:h,loading:b,refresh:x}=ct("/api/channels/accounts",To,{maxAgeMs:3e4}),v=q(async()=>{i(!0);try{let[M,R]=await Promise.all([m({force:!0}),x({force:!0})]);n(Array.isArray(M?.bindings)?M.bindings:[]),o(Array.isArray(R?.channels)?R.channels:[])}catch{n([]),o([])}finally{i(!1)}},[m,x]);L(()=>{n(Array.isArray(f?.bindings)?f.bindings:[]),o(Array.isArray(h?.channels)?h.channels:[]),i(!!(g||b))},[g,f,b,h]),L(()=>{let M=R=>{String(R?.detail?.agentId||"").trim()===u&&v()};return window.addEventListener("alphaclaw:agent-bindings-changed",M),()=>{window.removeEventListener("alphaclaw:agent-bindings-changed",M)}},[u,v]),L(()=>()=>{c.current&&clearTimeout(c.current);for(let M of d.current)clearTimeout(M);d.current=[]},[]);let w=F(()=>{let M=new Map;for(let R of e){let B=String(R?.match?.channel||"").trim();if(!B)continue;let I=String(R?.match?.accountId||"").trim()||"default",U=to(B,I);U&&M.set(U,{channel:B,accountId:I})}for(let R of s){let B=String(R?.channel||"").trim(),U=(Array.isArray(R?.accounts)?R.accounts:[]).find(W=>String(W?.id||"").trim()==="default");if(p&&B&&U&&!String(U?.boundAgentId||"").trim()){let W=to(B,"default");M.set(W,{channel:B,accountId:"default"})}}return Array.from(M.values())},[e,s,p]),$=F(()=>Array.from(new Set(w.map(M=>M.channel))).filter(Boolean),[w]),S=F(()=>new Set(w.map(M=>to(M.channel,M.accountId)).filter(Boolean)),[w]),C=F(()=>{let M=new Map;for(let R of s){let B=String(R?.channel||"").trim(),I=Array.isArray(R?.accounts)?R.accounts:[];for(let U of I){let W=String(U?.id||"").trim()||"default",G=to(B,W);if(!G)continue;let se=String(U?.name||"").trim();M.set(G,se||W)}}return M},[s]),_=F(()=>{let M={};for(let R of w){let B=String(R?.channel||"").trim();if(!B)continue;let I=to(B,R?.accountId),U=s.find(G=>String(G?.channel||"").trim()===B)?.accounts?.find(G=>(String(G?.id||"").trim()||"default")===(String(R?.accountId||"").trim()||"default")),W=String(U?.status||"").trim()||"configured";(!M[B]||W!=="paired")&&(M[B]={status:W==="paired"?"paired":"configured",accountName:C.get(I)||""})}return M},[C,s,w]),k=F(()=>Object.values(_).some(M=>String(M?.status||"").trim()!=="paired"),[_]),A=Re(async()=>{let M=await Co();return(Array.isArray(M?.pending)?M.pending:[]).filter(B=>S.has(to(String(B?.channel||"").trim(),String(B?.accountId||"").trim()||"default"))).map(B=>{let I=to(B?.channel,B?.accountId);return{...B,accountName:C.get(I)||""}})},3e3,{enabled:k&&w.length>0,cacheKey:`/api/pairings?agent=${encodeURIComponent(u)}`}),O=A.data||[],D=q(()=>{l(!0),c.current&&clearTimeout(c.current),c.current=setTimeout(()=>{l(!1),c.current=null},2800);for(let R of d.current)clearTimeout(R);d.current=[];let M=()=>{A.refresh(),v(),a2(u)};M(),d.current.push(setTimeout(M,500)),d.current.push(setTimeout(M,2e3))},[u,v,A]),z=async(M,R,B="")=>{try{await _o(M,R,B),D()}catch(I){N(I.message||"Could not approve pairing","error")}},E=async(M,R,B="")=>{try{await Mo(M,R,B),D()}catch(I){N(I.message||"Could not reject pairing","error")}};return r?Nx`
      <div class="bg-surface border border-border rounded-xl p-4">
        <h3 class="card-label mb-3">Pairing</h3>
        <p class="text-sm text-fg-muted">Loading pairing status...</p>
      </div>
    `:k?Nx`
    <${tl}
      pending=${O}
      channels=${_}
      visible=${k}
      statusRefreshing=${a}
      onApprove=${z}
      onReject=${E}
    />
  `:null};var Bx=P.bind(T),nl=({agent:t=null,agents:e=[],onSetLocation:n=()=>{},channelsSection:s=null,pairingsSection:o=null})=>t?Bx`
      <div class="space-y-4">
        <${Dx}
          agent=${t}
          agents=${e}
          onSetLocation=${n}
        />
        <${Ox} agent=${t} />
      </div>
    `:Bx`
    <div class="space-y-4">
      ${s}
      ${o}
    </div>
  `;var Xd=P.bind(T),Fx=({agent:t={},saving:e=!1,onSetDefault:n=()=>{},onDelete:s=()=>{}})=>{let o=String(t.id||"")==="main";return Xd`
    <div class="bg-surface border border-border rounded-xl p-4">
      <h3 class="card-label mb-3">Manage</h3>
      <div class="flex flex-wrap items-center gap-2">
        ${t.default?null:Xd`
              <${Z}
                onClick=${()=>n(t.id)}
                disabled=${e}
                tone="secondary"
                size="sm"
                idleLabel="Set as default"
              />
            `}
        ${o?null:Xd`
              <${Z}
                onClick=${()=>s(t)}
                disabled=${e}
                tone="danger"
                size="sm"
                idleLabel="Delete agent"
              />
            `}
      </div>
    </div>
  `};var oi=P.bind(T),l2=["anthropic","openai","openai-codex",...jr.filter(t=>!["anthropic","openai"].includes(t))],ri=t=>{let e=js(t);return e==="openai-codex"?"openai-codex":Ro(e)},vs=t=>String(t?.provider||js(t?.key)).trim(),jo=t=>{let e=l2.indexOf(t);return e>=0?e:Number.MAX_SAFE_INTEGER},c2=t=>String(zs[t]||t).toUpperCase(),d2=t=>String(t||"").trim().toLowerCase(),Qd=t=>t?.featuredLabel||t?.label||t?.key,u2=t=>[t?.featuredLabel||"",t?.label||"",t?.key||"",t?.provider||js(t?.key)].join(" ").toLowerCase(),sl=({authProfiles:t=[],codexStatus:e={connected:!1}}={})=>{let n={};for(let s of t)(s?.key||s?.token||s?.access)&&(n[s.provider]=!0);return e?.connected&&(n["openai-codex"]=!0),n},ol=({options:t=[],popularModels:e=[],placeholder:n="Add model...",onSelect:s=()=>{},disabled:o=!1})=>{let[r,i]=y(""),[a,l]=y(!1),c=ee(null),d=d2(r),u=F(()=>d?t.filter(m=>u2(m).includes(d)):t,[t,d]),p=F(()=>{let m=[],h=!d,b=new Set(u.map(v=>v.key)),x=e.filter(v=>b.has(v.key));h&&x.length>0&&m.push({provider:"popular",label:"POPULAR",options:x});for(let v of u){let w=vs(v),$=c2(w),S=m[m.length-1];if(!S||S.provider!==w){m.push({provider:w,label:$,options:[v]});continue}S.options.push(v)}return m},[u,e,d]);L(()=>{let m=h=>{c.current?.contains(h.target)||l(!1)};return document.addEventListener("mousedown",m),()=>document.removeEventListener("mousedown",m)},[]);let f=m=>{!m||o||(s(m),i(""),l(!1))};return oi`
    <div class="relative" ref=${c}>
      <input
        type="text"
        value=${r}
        placeholder=${n}
        disabled=${o}
        onFocus=${()=>{o||l(!0)}}
        onInput=${m=>{i(m.target.value),l(!0)}}
        onKeyDown=${m=>{let h=p[0]?.options?.[0];if(m.key==="Escape"){l(!1);return}m.key==="Enter"&&h?.key&&(m.preventDefault(),f(h.key))}}
        class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm text-body outline-none focus:border-fg-muted disabled:opacity-50 disabled:cursor-not-allowed"
      />
      ${a&&!o?oi`
            <div
              class="absolute left-0 right-0 top-full mt-2 z-20 bg-modal border border-border rounded-xl shadow-2xl overflow-hidden"
            >
              <div class="max-h-80 overflow-y-auto">
                ${u.length>0?p.map((m,h)=>oi`
                        <div key=${m.provider}>
                          <div
                            class=${`sticky top-0 z-10 h-[22px] px-3 text-[12px] font-semibold tracking-wide text-fg-muted bg-[#151922] border-b border-border flex items-center ${h>0?"border-t border-border":""}`}
                          >
                            ${m.label}
                          </div>
                          ${m.options.map(b=>oi`
                              <button
                                key=${b.key}
                                type="button"
                                onMouseDown=${x=>x.preventDefault()}
                                onClick=${()=>f(b.key)}
                                class="w-full text-left px-3 py-2 hover:bg-surface border-b border-border last:border-b-0"
                              >
                                <div class="flex flex-col gap-1">
                                  <div class="text-sm text-body">
                                    ${Qd(b)}
                                  </div>
                                  <div class="text-xs text-fg-muted font-mono">
                                    ${b.key}
                                  </div>
                                </div>
                              </button>
                            `)}
                        </div>
                      `):oi`
                      <div class="px-3 py-3 text-xs text-fg-muted">
                        No models match that search.
                      </div>
                    `}
              </div>
            </div>
          `:null}
    </div>
  `};var cn=null,zo=t=>String(t?.key||t?.token||t?.access||"").trim(),rl=t=>{let e=!!t,n=String(t||"").trim(),s=!e,[o,r]=y(()=>s&&cn?.catalog||[]),[i,a]=y(()=>s&&cn?.primary||""),[l,c]=y(()=>s&&cn?.configuredModels||{}),[d,u]=y(()=>s&&cn?.authProfiles||[]),[p,f]=y(()=>s&&cn?.authOrder||{}),[g,m]=y(()=>s&&cn?.codexStatus||{connected:!1}),[h,b]=y(()=>!(s&&cn)),[x,v]=y(!1),[w,$]=y(()=>!!(s&&cn)),[S,C]=y(""),[_,k]=y({}),[A,O]=y({}),D=ee(cn?.primary||""),z=ee(cn?.configuredModels||{}),E=q(V=>{e||(cn={...cn||{},...V})},[e]),M=n?`/api/models/config?agentId=${encodeURIComponent(n)}`:"/api/models/config",R=ct("/api/models",Br,{maxAgeMs:3e4}),B=ct(M,()=>Hm(e?{agentId:t}:void 0),{maxAgeMs:3e4}),I=ct("/api/codex/status",Po,{maxAgeMs:15e3}),U=q(async()=>{w||b(!0),C("");try{let[V,J,oe]=await Promise.all([R.refresh({force:!0}),B.refresh({force:!0}),I.refresh({force:!0})]),ce=Array.isArray(V.models)?V.models:[];r(ce);let be=J.primary||"",Ve=J.configuredModels||{},et=J.authProfiles||[],kt=J.authOrder||{};a(be),c(Ve),u(et),f(kt),m(oe||{connected:!1}),k({}),O({}),D.current=be,z.current=Ve,E({catalog:ce,primary:be,configuredModels:Ve,authProfiles:et,authOrder:kt,codexStatus:oe||{connected:!1}}),ce.length||C("No models found")}catch(V){C("Failed to load model settings"),N(`Failed to load model settings: ${V.message}`,"error")}finally{$(!0),b(!1)}},[R,I,B,w,E,t,e]);L(()=>{U()},[t]);let W=V=>JSON.stringify(Object.keys(V).sort().reduce((J,oe)=>(J[oe]=V[oe],J),{})),G=i!==D.current||W(l)!==W(z.current),se=(()=>{let V=Object.entries(_).some(([oe,ce])=>{let be=d.find(Ve=>Ve.id===oe);return zo(ce)!==zo(be)}),J=Object.entries(A).some(([oe,ce])=>{let be=p[oe];return JSON.stringify(ce)!==JSON.stringify(be)});return V||J})(),K=G||se,j=q(V=>{V&&c(J=>{let oe={...J,[V]:{}};return E({configuredModels:oe}),oe})},[E]),X=q(V=>{if(c(J=>{let oe={...J};return delete oe[V],E({configuredModels:oe}),oe}),i===V){let oe=Object.keys(l).filter(ce=>ce!==V)[0]||"";a(oe),E({primary:oe})}},[i,l,E]),de=q(V=>{a(V),E({primary:V})},[E]),le=q((V,J)=>{let oe=d.find(ce=>ce.id===V);if(zo(J)===zo(oe)){k(ce=>{let be={...ce};return delete be[V],be});return}k(ce=>({...ce,[V]:J}))},[d]),ie=q((V,J)=>{let oe=p[V]||null;if(JSON.stringify(J)===JSON.stringify(oe)){O(ce=>{let be={...ce};return delete be[V],be});return}O(ce=>({...ce,[V]:J}))},[p]),ne=q(V=>_[V]!==void 0?_[V]:d.find(oe=>oe.id===V)||null,[_,d]),xe=q(V=>A[V]!==void 0?A[V]:p[V]||null,[A,p]),he=q(()=>{let V=D.current||"",J=z.current||{};a(V),c(J),k({}),O({}),E({primary:V,configuredModels:J})},[E]),ue=q(async()=>{if(!x){v(!0);try{let V=Object.entries(_).filter(([oe,ce])=>{let be=d.find(Ve=>Ve.id===oe);return zo(ce)!==zo(be)}).map(([oe,ce])=>({id:oe,...ce})),J=await Wm({primary:i,configuredModels:l,profiles:V.length>0?V:void 0,authOrder:Object.keys(A).length>0?A:void 0,...e?{agentId:t}:{}});if(!J.ok)throw new Error(J.error||"Failed to save config");N("Changes saved","success"),J.syncWarning&&N(`Saved, but git-sync failed: ${J.syncWarning}`,"warning"),await U()}catch(V){N(V.message||"Failed to save changes","error")}finally{v(!1)}}},[x,i,l,_,A,d,U]),me=q(async()=>{try{let V=await Po();m(V||{connected:!1}),E({codexStatus:V||{connected:!1}})}catch{m({connected:!1}),E({codexStatus:{connected:!1}})}},[E]);return{catalog:o,primary:i,configuredModels:l,authProfiles:d,authOrder:p,codexStatus:g,loading:h,saving:x,ready:w,error:S,isDirty:K,refresh:U,addModel:j,removeModel:X,setPrimaryModel:de,editProfile:le,editAuthOrder:ie,getProfileValue:ne,getEffectiveOrder:xe,cancelChanges:he,saveAll:ue,refreshCodexStatus:me}};var p2=t=>t?typeof t=="string"?t:t.primary||null:null,Hx=(t=[],e="")=>t.find(n=>String(n?.key||"").trim()===String(e||"").trim())||null,Wx=({agent:t={},onUpdateAgent:e=async()=>{}})=>{let[n,s]=y(!1),[o,r]=y(!1),{catalog:i,primary:a,configuredModels:l,authProfiles:c,codexStatus:d,loading:u,ready:p}=rl(),f=p2(t.model),g=f||a||"",m=!!f&&String(f).trim()!==String(a||"").trim(),h=F(()=>sl({authProfiles:c,codexStatus:d}),[c,d]),b=F(()=>Object.keys(l||{}).map(k=>Hx(i,k)||{key:k,label:k}).filter(k=>{let A=ri(k.key);return!!h[A]}).sort((k,A)=>{let O=jo(vs(k))-jo(vs(A));return O!==0?O:String(k?.label||k?.key).localeCompare(String(A?.label||A?.key))}),[i,l,h]),x=F(()=>Hx(i,g)||(g?{key:g,label:g}:null),[i,g]),v=F(()=>b.filter(k=>{let A=vs(k);return A==="anthropic"||A==="openai"}),[b]),w=F(()=>{if(!x)return[];let k=String(x?.key||"").trim(),A=b.filter(O=>String(O?.key||"").trim()!==k);return[x,...A]},[b,x]),$=F(()=>new Set(w.map(k=>String(k?.key||"").trim()).filter(Boolean)),[w]),S=F(()=>b.filter(k=>!$.has(String(k?.key||"").trim())),[b,$]);return{authorizedModelOptions:b,canEditModel:p&&!u,effectiveModel:g,effectiveModelEntry:x,handleClearModelOverride:async()=>{if(m){s(!0);try{await e(String(t.id||"").trim(),{model:null},"Agent model reset to default")}finally{s(!1)}}},handleSelectModel:async k=>{let A=String(k||"").trim();if(!(!A||A===g)){s(!0);try{await e(String(t.id||"").trim(),{model:{primary:A}},"Agent model updated")}finally{s(!1)}}},hasDistinctModelOverride:m,loading:!p||u,menuOpen:o,modelEntries:w,popularModels:v,remainingModelOptions:S,setMenuOpen:r,updatingModel:n}};var sn=P.bind(T),Vx=({agent:t={},saving:e=!1,onUpdateAgent:n=async()=>{},onSwitchToModels:s=()=>{}})=>{let{authorizedModelOptions:o,canEditModel:r,effectiveModel:i,effectiveModelEntry:a,handleClearModelOverride:l,handleSelectModel:c,hasDistinctModelOverride:d,loading:u,menuOpen:p,modelEntries:f,popularModels:g,remainingModelOptions:m,setMenuOpen:h,updatingModel:b}=Wx({agent:t,onUpdateAgent:n});return sn`
    <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-start justify-between gap-3">
        <h3 class="card-label">Model</h3>
        ${u?null:sn`
              <div class="flex items-center gap-2 min-h-6">
                ${a&&!d?sn`<${ae} tone="neutral">Inherited</${ae}>`:null}
                <${pt}
                  open=${p}
                  ariaLabel="Open model actions"
                  title="Open model actions"
                  onClose=${()=>h(!1)}
                  onToggle=${()=>h(x=>!x)}
                >
                  ${d?sn`
                        <${We}
                          onClick=${()=>{h(!1),l()}}
                        >
                          Inherit from defaults
                        </${We}>
                      `:null}
                  <${We}
                    onClick=${()=>{h(!1),s()}}
                  >
                    Manage models
                  </${We}>
                </${pt}>
              </div>
            `}
      </div>
      ${u?sn`
            <div class="flex items-center gap-2 text-sm text-fg-muted py-1">
              <${Ce} className="h-4 w-4" />
              Loading model settings...
            </div>
          `:f.length===0?sn`<p class="text-xs text-fg-muted">
              No authorized models available yet. Add one from the Models tab
              first.
            </p>`:sn`
              <div class="space-y-1">
                ${f.map(x=>sn`
                    <div
                      key=${x.key}
                      class="flex items-center justify-between py-1"
                    >
                      <div class="flex items-center gap-2 min-w-0">
                        <span class="text-sm text-body truncate">
                          ${Qd(x)}
                        </span>
                        ${x.key===i?sn`<${ae} tone="cyan">Primary</${ae}>`:sn`
                              <button
                                type="button"
                                onclick=${()=>c(x.key)}
                                class="text-xs px-2 py-0.5 rounded-full text-fg-muted hover:text-body hover:bg-surface"
                              >
                                Set primary
                              </button>
                            `}
                      </div>
                    </div>
                  `)}
              </div>
            `}
      ${u?null:m.length>0?sn`
              <div class="space-y-2">
                <${ol}
                  options=${m}
                  popularModels=${g}
                  placeholder=${o.length>0?"Add model...":"No authorized models available"}
                  onSelect=${c}
                  disabled=${e||b||!r||m.length===0}
                />
                ${o.length===0?sn`
                      <p class="text-xs text-fg-muted">
                        Add and authorize models from the Models tab before
                        assigning one here.
                      </p>
                    `:sn`
                      <p class="text-xs text-fg-muted">
                        Only models that already have working auth are
                        available here.
                      </p>
                    `}
              </div>
            `:null}
    </div>
  `};var jx=["minimal","messaging","coding","full"],il={minimal:"Minimal",messaging:"Messaging",coding:"Coding",full:"Full"},eu=[{id:"read",label:"Read files",profiles:["coding"],section:"filesystem"},{id:"edit",label:"Edit files",profiles:["coding"],section:"filesystem"},{id:"write",label:"Write files",profiles:["coding"],section:"filesystem"},{id:"apply_patch",label:"Apply patches",help:"Make targeted patch edits, mainly for OpenAI-compatible patch workflows.",profiles:["coding"],section:"filesystem"},{id:"exec",label:"Run commands",help:"Execute shell commands inside the agent environment.",profiles:["coding"],section:"execution"},{id:"process",label:"Manage processes",help:"Inspect and control long-running background processes.",profiles:["coding"],section:"execution"},{id:"message",label:"Send messages",help:"Send outbound messages through configured messaging channels.",profiles:["messaging"],section:"communication"},{id:"tts",label:"Text-to-speech",help:"Convert text responses into generated speech audio.",profiles:[],section:"communication"},{id:"browser",label:"Control browser",help:"Drive a browser for page navigation and interactive web tasks.",profiles:[],section:"web"},{id:"web_search",label:"Search the web",help:"Run web searches to discover external information.",profiles:[],section:"web"},{id:"web_fetch",label:"Fetch URLs",help:"Fetch and read webpage content from a specific URL.",profiles:[],section:"web"},{id:"memory_search",label:"Semantic search",help:"Search memory semantically to find related notes and prior context.",profiles:["coding"],section:"memory"},{id:"memory_get",label:"Read memories",help:"Read stored memory files and saved context entries.",profiles:["coding"],section:"memory"},{id:"agents_list",label:"List agents",help:"List known agent IDs that can be targeted in multi-agent flows.",profiles:[],section:"multiagent"},{id:"sessions_spawn",label:"Spawn sessions",help:"Start a new background session/run; this is the base primitive used by sub-agent workflows.",profiles:["coding"],section:"multiagent"},{id:"sessions_send",label:"Send to session",help:"Send messages or tasks into an existing running session.",profiles:["coding","messaging"],section:"multiagent"},{id:"sessions_list",label:"List sessions",help:"List active or recent sessions available to the agent.",profiles:["coding","messaging"],section:"multiagent"},{id:"sessions_history",label:"Session history",help:"Read the transcript and prior exchanges from a session.",profiles:["coding","messaging"],section:"multiagent"},{id:"session_status",label:"Session status",help:"Check whether a session is running and inspect runtime health/state.",profiles:["minimal","coding","messaging"],section:"multiagent"},{id:"subagents",label:"Sub-agents",help:"Launch specialized delegated agents (higher-level orchestration built on session spawning).",profiles:["coding"],section:"multiagent"},{id:"cron",label:"Scheduled jobs",help:"Create and manage scheduled automation jobs.",profiles:["coding"],section:"scheduling"},{id:"gateway",label:"Gateway control",help:"Inspect and control the running Gateway service (status, health, and control actions like restart).",profiles:[],section:"scheduling"},{id:"image",label:"Generate images",help:"Generate or analyze images with image-capable model tools.",profiles:["coding"],section:"creative"},{id:"canvas",label:"Visual canvas",help:"Control the Canvas panel (present, navigate, eval, snapshot). Primarily a macOS app capability when a canvas-capable node is connected.",profiles:[],section:"creative"},{id:"nodes",label:"Node workflows",help:"Use paired device/node capabilities (for example canvas, camera, notifications, and system actions).",profiles:[],section:"creative"}],zx=[{id:"filesystem",label:"Filesystem",description:"Read, edit, and write files"},{id:"execution",label:"Execution",description:"Run shell commands and scripts"},{id:"communication",label:"Communication",description:"Send messages across Telegram, Slack, Discord"},{id:"web",label:"Web & Browser",description:"Browse pages, search the web, fetch URLs"},{id:"memory",label:"Memory",description:"Semantic search and retrieval across the agent's stored knowledge"},{id:"multiagent",label:"Multi-Agent",description:"List agents, spawn sessions, send messages between agents. Orchestrate sub-agents."},{id:"scheduling",label:"Scheduling",description:"Create and manage scheduled jobs"},{id:"creative",label:"Creative",description:"Generate images, visual canvas, node-based workflows"}];var ii=t=>t==="full"?eu.map(e=>e.id):eu.filter(e=>e.profiles.includes(t)).map(e=>e.id),Ux=({profile:t="full",alsoAllow:e=[],deny:n=[]})=>{let s=new Set(ii(t)),o=new Set(e),r=new Set(n);return eu.map(i=>{let a=s.has(i.id),l=r.has(i.id),c=o.has(i.id);return{...i,enabled:l?!1:a||c,inProfile:a,isDenied:l,isAlsoAllowed:c}})},Kx=({profile:t,toolStates:e})=>{let n=new Set(ii(t)),s=[],o=[];for(let i of e){let a=n.has(i.id);i.enabled&&!a?s.push(i.id):!i.enabled&&a&&o.push(i.id)}let r={profile:t};return s.length&&(r.alsoAllow=s),o.length&&(r.deny=o),r};var f2=P.bind(T),Gx=({profile:t="full",enabledCount:e=0,totalCount:n=0,onSwitchToTools:s=()=>{}})=>{let o=il[t]||t;return f2`
    <div class="bg-surface border border-border rounded-xl p-4">
      <h2 class="card-label mb-3">Tools</h2>
      <div
        class="flex items-center justify-between gap-3 cursor-pointer hover:bg-surface -mx-2 px-2 py-1.5 rounded-lg transition-colors"
        role="button"
        tabindex="0"
        onclick=${s}
        onKeyDown=${r=>{(r.key==="Enter"||r.key===" ")&&(r.preventDefault(),s())}}
      >
        <span class="font-medium text-sm">${o}</span>
        <span class="flex items-center gap-2 shrink-0">
          <span class="text-xs text-fg-muted">
            ${e}/${n} enabled
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            class="text-fg-dim"
          >
            <path
              d="M6 3.5L10.5 8L6 12.5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>
  `};var qx=({agent:t={}})=>{let[e,n]=y(null),[s,o]=y(!0),[r,i]=y(!1);return L(()=>{let a=!1,l=String(t?.id||"").trim(),c=String(t?.workspace||"").trim();if(!l||!c){n(null),o(!0),i(!1);return}return i(!0),Km(l).then(d=>{a||(n(Number(d?.sizeBytes||0)),o(d?.exists!==!1))}).catch(()=>{a||(n(null),o(!1))}).finally(()=>{a||i(!1)}),()=>{a=!0}},[t?.id,t?.workspace]),{loadingWorkspaceSize:r,workspaceSizeBytes:e,workspaceSizeExists:s}};var tu=P.bind(T),Jx=({agent:t={},onOpenWorkspace:e=()=>{}})=>{let{loadingWorkspaceSize:n,workspaceSizeBytes:s,workspaceSizeExists:o}=qx({agent:t});return tu`
    <div class="bg-surface border border-border rounded-xl p-4 space-y-2">
      <h3 class="card-label">Workspace</h3>
      ${t.workspace?tu`
            <div
              class="flex flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-3"
            >
              <button
                type="button"
                class="text-sm font-mono break-all text-left ac-tip-link hover:underline md:min-w-0"
                onclick=${()=>e(t.workspace)}
              >
                ${t.workspace}
              </button>
              <div class="text-xs text-fg-muted md:shrink-0 md:text-right">
                ${n?"Calculating size...":s!=null?Xb(s):o?"Size unavailable":"Workspace directory not found"}
              </div>
            </div>
          `:tu`<p class="text-sm text-fg-muted">No workspace configured</p>`}
    </div>
  `};var Zx=P.bind(T),Yx=({agent:t={},agents:e=[],saving:n=!1,toolsSummary:s={},onUpdateAgent:o=async()=>{},onSetLocation:r=()=>{},onOpenWorkspace:i=()=>{},onSwitchToModels:a=()=>{},onSwitchToTools:l=()=>{},onSetDefault:c=()=>{},onDelete:d=()=>{}})=>{let u=String(t.id||"")==="main",p=!t.default||!u;return Zx`
    <div class="space-y-4">
      <${Jx}
        agent=${t}
        onOpenWorkspace=${i}
      />
      <${Vx}
        agent=${t}
        saving=${n}
        onUpdateAgent=${o}
        onSwitchToModels=${a}
      />
      <${Gx}
        profile=${s.profile||"full"}
        enabledCount=${s.enabledCount||0}
        totalCount=${s.totalCount||0}
        onSwitchToTools=${l}
      />
      <${nl}
        agent=${t}
        agents=${e}
        onSetLocation=${r}
      />
      ${p?Zx`
            <${Fx}
              agent=${t}
              saving=${n}
              onSetDefault=${c}
              onDelete=${d}
            />
          `:null}
    </div>
  `};var Xx=P.bind(T),vn=({checked:t=!1,disabled:e=!1,onChange:n=()=>{},label:s="Enabled"})=>Xx`
  <label class="ac-toggle">
    <input
      class="ac-toggle-input"
      type="checkbox"
      checked=${!!t}
      disabled=${!!e}
      onchange=${o=>n(!!o.target.checked)}
    />
    <span class="ac-toggle-track" aria-hidden="true">
      <span class="ac-toggle-thumb"></span>
    </span>
    ${s?Xx`<span class="ac-toggle-label">${s}</span>`:null}
  </label>
`;var h2=P.bind(T),no=({text:t="",widthClass:e="w-64"})=>h2`
  <${yt} text=${t} widthClass=${e}>
    <span
      class="inline-flex h-4 w-4 items-center justify-center rounded-full border border-fg-muted text-[10px] text-fg-muted cursor-default select-none"
      aria-label=${t}
      >?</span
    >
  </${yt}>
`;var Uo=P.bind(T),m2={minimal:"Only session status \u2014 grant specific tools with alsoAllow",messaging:"Session access and messaging \u2014 ideal for notification agents",coding:"File I/O, shell, memory, sessions, cron, and image generation",full:"All tools enabled, no restrictions"},g2=jx.map(t=>({label:il[t],value:t,title:m2[t]})),b2=({tool:t,onToggle:e})=>Uo`
  <div class="flex items-center justify-between gap-3 py-2.5 px-4">
    <div class="min-w-0">
      <div class="text-sm text-body flex items-center gap-1.5">
        <span>${t.label}</span>
        ${t.help?Uo`<${no} text=${t.help} widthClass="w-72" />`:null}
      </div>
      <span class="text-xs font-mono text-fg-muted">${t.id}</span>
    </div>
    <${vn}
      checked=${t.enabled}
      onChange=${n=>e(t.id,n)}
      label=${null}
    />
  </div>
`,x2=({section:t,toolStates:e,onToggle:n})=>{let s=e.filter(o=>o.section===t.id);return s.length?Uo`
    <div class="bg-surface border border-border rounded-xl overflow-hidden">
      <h3 class="card-label text-xs px-4 pt-3 pb-2">${t.label}</h3>
      <div class="divide-y divide-border">
        ${s.map(o=>Uo`<${b2}
              key=${o.id}
              tool=${o}
              onToggle=${n}
            />`)}
      </div>
    </div>
  `:null},Qx=({agent:t={},tools:e={}})=>{let{profile:n,toolStates:s,setProfile:o,toggleTool:r}=e,i=(s||[]).filter(l=>l.enabled).length,a=(s||[]).length;return Uo`
    <div class="space-y-4">
      <div class="bg-surface border border-border rounded-xl p-4 space-y-4">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="card-label text-xs">Preset</h3>
            <span class="text-xs text-fg-muted"
              >${i}/${a} tools enabled</span
            >
          </div>
          <${Xe}
            options=${g2}
            value=${n}
            onChange=${o}
            fullWidth
            className="ac-segmented-control-dark"
          />
        </div>
      </div>

      <div style="columns: 2; column-gap: 0.75rem;">
        ${zx.map(l=>Uo`
            <div style="break-inside: avoid; margin-bottom: 0.75rem;">
              <${x2}
                key=${l.id}
                section=${l}
                toolStates=${s||[]}
                onToggle=${r}
              />
            </div>
          `)}
      </div>
    </div>
  `};var nu=(t=[],e=[])=>{let n={};for(let s of t)n[s]=!0;for(let s of e)n[s]=!1;return n},su=({profile:t="full",alsoAllow:e=[],deny:n=[]}={})=>({profile:String(t||"full"),alsoAllow:[...Array.isArray(e)?e:[]].map(String).filter(Boolean).sort(),deny:[...Array.isArray(n)?n:[]].map(String).filter(Boolean).sort()}),ey=({agent:t={}}={})=>{let e=t.tools||{},n=su(e),s=n.profile,o=n.alsoAllow,r=n.deny,[i,a]=y(s),[l,c]=y(()=>nu(o,r)),[d,u]=y(n),p=JSON.stringify([t.id,e]),f=ee(p);L(()=>{f.current!==p&&(f.current=p,a(s),c(nu(o,r)),u(n))},[p,s,o,r,n]);let g=F(()=>{let $=new Set(ii(i)),S=[],C=[];for(let[_,k]of Object.entries(l))k&&!$.has(_)?S.push(_):!k&&$.has(_)&&C.push(_);return Ux({profile:i,alsoAllow:S,deny:C})},[i,l]),m=F(()=>Kx({profile:i,toolStates:g}),[i,g]),h=F(()=>{let $=su(m);return JSON.stringify(d)!==JSON.stringify($)},[d,m]),b=q($=>{a($),c({})},[]),x=q(($,S)=>{c(C=>{let _={...C};return new Set(ii(i)).has($)===S?delete _[$]:_[$]=S,_})},[i]),v=q(()=>{a(d.profile);let $={};for(let S of d.alsoAllow)$[S]=!0;for(let S of d.deny)$[S]=!1;c($)},[d]),w=q(($={})=>{let S=su($);u(S),a(S.profile),c(nu(S.alsoAllow,S.deny))},[]);return{profile:i,toolStates:g,toolsConfig:m,dirty:h,setProfile:b,toggleTool:x,reset:v,markSaved:w}};var Ko=P.bind(T),y2=[{label:"Overview",value:"overview"},{label:"Tools",value:"tools"}],v2=({className:t="w-3.5 h-3.5"})=>Ko`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    class=${t}
  >
    <path
      d="M15.7279 9.57627L14.3137 8.16206L5 17.4758V18.89H6.41421L15.7279 9.57627ZM17.1421 8.16206L18.5563 6.74785L17.1421 5.33363L15.7279 6.74785L17.1421 8.16206ZM7.24264 20.89H3V16.6473L16.435 3.21231C16.8256 2.82179 17.4587 2.82179 17.8492 3.21231L20.6777 6.04074C21.0682 6.43126 21.0682 7.06443 20.6777 7.45495L7.24264 20.89Z"
    />
  </svg>
`,ty=({agent:t=null,agents:e=[],activeTab:n="overview",saving:s=!1,onUpdateAgent:o=async()=>{},onSetLocation:r=()=>{},onSelectTab:i=()=>{},onEdit:a=()=>{},onDelete:l=()=>{},onSetDefault:c=()=>{},onOpenWorkspace:d=()=>{}})=>{let u=ey({agent:t||{}}),[p,f]=y(!1),g=q(async()=>{if(t){f(!0);try{let b=await o(t.id,{tools:u.toolsConfig},"Tool access updated");u.markSaved(b?.tools||u.toolsConfig)}catch{}finally{f(!1)}}},[t,u.toolsConfig,u.markSaved,o]),m=s||p,h=F(()=>({profile:u.profile,enabledCount:(u.toolStates||[]).filter(b=>b.enabled).length,totalCount:(u.toolStates||[]).length}),[u.profile,u.toolStates]);return t?Ko`
    <div class="agents-detail-panel">
      <div class="agents-detail-header-area">
        <div class="agents-detail-header-area-inner">
          <div class="agents-detail-header">
            <div class="min-w-0">
              <div class="flex items-center gap-2 min-w-0">
                <span class="agents-detail-header-title">
                  ${t.name||t.id}
                </span>
                <button
                  type="button"
                  class="text-fg-muted hover:text-body transition-colors p-0.5 -ml-0.5"
                  onclick=${()=>a(t)}
                  title="Edit agent name"
                >
                  <${v2} />
                </button>
                ${t.default?Ko`<${ae} tone="cyan">Default</${ae}>`:null}
              </div>
              <div class="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 min-w-0 text-xs text-fg-muted">
                <span class="font-mono">${t.id}</span>
              </div>
            </div>
            <${Qn} visible=${u.dirty}>
              <${Z}
                onClick=${u.reset}
                disabled=${m}
                tone="secondary"
                size="sm"
                idleLabel="Cancel"
                className="text-xs"
              />
              <${Z}
                onClick=${g}
                disabled=${m}
                loading=${m}
                loadingMode="inline"
                tone="primary"
                size="sm"
                idleLabel="Save changes"
                loadingLabel="Saving…"
                className="text-xs"
              />
            </${Qn}>
          </div>
          <${Mx}
            tabs=${y2}
            activeTab=${n}
            onSelectTab=${i}
            className="flex items-center gap-2 pt-6"
          />
        </div>
      </div>
      <div class="agents-detail-body">
        <div class="agents-detail-content">
          ${n==="overview"?Ko`
                <${Yx}
                  agent=${t}
                  agents=${e}
                  saving=${s}
                  toolsSummary=${h}
                  onUpdateAgent=${o}
                  onSetLocation=${r}
                  onOpenWorkspace=${d}
                  onSwitchToModels=${()=>r("/models")}
                  onSwitchToTools=${()=>i("tools")}
                  onSetDefault=${c}
                  onDelete=${l}
                />
              `:Ko`
                <${Qx}
                  agent=${t}
                  tools=${u}
                />
              `}
        </div>
      </div>
    </div>
  `:Ko`
      <div class="agents-detail-panel">
        <div class="agents-empty-state">
          <span class="text-sm">Select an agent to view details</span>
        </div>
      </div>
    `};var ou=P.bind(T),ny=/^[a-z0-9]+(?:-[a-z0-9]+)*$/,sy=/^[a-z0-9]+(?:-[a-z0-9]+)*$/,ru=t=>String(t||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,""),oy=({visible:t=!1,loading:e=!1,onClose:n=()=>{},onSubmit:s=()=>{}})=>{let[o,r]=y(""),[i,a]=y(""),[l,c]=y(""),[d,u]=y(""),[p,f]=y(!1),[g,m]=y(!1);L(()=>{t&&(r(""),a(""),c(""),u(""),f(!1),m(!1))},[t]),L(()=>{if(p)return;let v=ru(o);a(v)},[o,p]),L(()=>{if(g)return;let v=String(i||"").trim();if(!v){c("");return}c(v)},[i,g]);let h=F(()=>`workspace-${String(l||"").trim()}`,[l]),b=String(o||"").trim().length>0&&ny.test(String(i||"").trim())&&sy.test(String(l||"").trim());if(!t)return null;let x=async()=>{let v=String(o||"").trim(),w=String(i||"").trim(),$=String(l||"").trim(),S=`workspace-${$}`;if(!v){u("Display name is required");return}if(!ny.test(w)){u("Agent ID must be lowercase letters, numbers, and hyphens");return}if(!sy.test($)){u("Workspace folder must be lowercase letters, numbers, and hyphens");return}u(""),await s({name:v,id:w,workspaceFolder:S})};return ou`
    <${De}
      visible=${t}
      onClose=${n}
      panelClassName="bg-modal border border-border rounded-xl p-6 max-w-lg w-full space-y-4"
    >
      <${Ne}
        title="Add Agent"
        actions=${ou`
          <button
            type="button"
            onclick=${n}
            class="h-8 w-8 inline-flex items-center justify-center rounded-lg ac-btn-secondary"
            aria-label="Close modal"
          >
            <${nt} className="w-3.5 h-3.5 text-body" />
          </button>
        `}
      />

      <div class="space-y-3">
        <label class="block space-y-1">
          <span class="text-xs text-fg-muted">Display name</span>
          <input
            type="text"
            value=${o}
            onInput=${v=>r(v.target.value)}
            placeholder="Ops Agent"
            class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm text-body outline-none focus:border-fg-muted"
          />
        </label>

        <label class="block space-y-1">
          <span class="text-xs text-fg-muted">Agent ID</span>
          <input
            type="text"
            value=${i}
            onInput=${v=>{f(!0),a(ru(v.target.value))}}
            placeholder="ops-agent"
            class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm font-mono text-body outline-none focus:border-fg-muted"
          />
        </label>

        <label class="block space-y-1">
          <span class="text-xs text-fg-muted">Workspace folder</span>
          <div class="flex items-center bg-field border border-border rounded-lg focus-within:border-fg-muted">
            <span class="px-3 py-2 text-xs font-mono text-fg-muted border-r border-border">
              .openclaw/workspace-
            </span>
            <input
              type="text"
              value=${l}
              onInput=${v=>{m(!0),c(ru(v.target.value))}}
              placeholder="ops-agent"
              class="flex-1 bg-transparent px-3 py-2 text-sm font-mono text-body outline-none"
            />
          </div>
        </label>

        ${d?ou`<p class="text-xs text-status-error-muted">${d}</p>`:null}
      </div>

      <div class="flex justify-end gap-2 pt-1">
        <${Z}
          onClick=${n}
          disabled=${e}
          loading=${!1}
          tone="secondary"
          size="md"
          idleLabel="Cancel"
        />
        <${Z}
          onClick=${x}
          disabled=${e||!b}
          loading=${e}
          tone="primary"
          size="md"
          idleLabel="Create Agent"
          loadingLabel="Creating..."
        />
      </div>
    </${De}>
  `};var ry=P.bind(T),iy=({visible:t=!1,loading:e=!1,agent:n=null,onCancel:s=()=>{},onConfirm:o=()=>{}})=>{let[r,i]=y(!0);return L(()=>{t&&i(!0)},[t]),ry`
    <${st}
      visible=${t}
      title="Delete agent"
      message=${`Delete "${String(n?.name||n?.id||"agent")}"?`}
      details=${ry`
        <div class="mt-2 pt-2 border-t border-border">
          <${vn}
            checked=${r}
            disabled=${e}
            onChange=${i}
            label="Keep workspace files"
          />
        </div>
      `}
      confirmLabel="Delete agent"
      confirmLoadingLabel="Deleting..."
      confirmTone="warning"
      confirmLoading=${e}
      onCancel=${s}
      onConfirm=${()=>o({id:String(n?.id||"").trim(),keepWorkspace:r})}
    />
  `};var iu=P.bind(T),ay=({visible:t=!1,loading:e=!1,agent:n=null,onClose:s=()=>{},onSubmit:o=()=>{}})=>{let[r,i]=y(""),[a,l]=y("");if(L(()=>{t&&(i(String(n?.name||"")),l(""))},[t,n]),!t)return null;let c=async()=>{let d=String(r||"").trim();if(!d){l("Display name is required");return}l(""),await o({id:String(n?.id||"").trim(),patch:{name:d}})};return iu`
    <${De}
      visible=${t}
      onClose=${s}
      panelClassName="bg-modal border border-border rounded-xl p-6 max-w-lg w-full space-y-4"
    >
      <${Ne}
        title="Edit Agent"
        actions=${iu`
          <button
            type="button"
            onclick=${s}
            class="h-8 w-8 inline-flex items-center justify-center rounded-lg ac-btn-secondary"
            aria-label="Close modal"
          >
            <${nt} className="w-3.5 h-3.5 text-body" />
          </button>
        `}
      />

      <div class="space-y-3">
        <label class="block space-y-1">
          <span class="text-xs text-fg-muted">Display name</span>
          <input
            type="text"
            value=${r}
            onInput=${d=>i(d.target.value)}
            class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm text-body outline-none focus:border-fg-muted"
          />
        </label>

        <label class="block space-y-1">
          <span class="text-xs text-fg-muted">Agent ID</span>
          <input
            type="text"
            value=${String(n?.id||"")}
            disabled=${!0}
            class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm font-mono text-fg-muted outline-none"
          />
        </label>

        ${a?iu`<p class="text-xs text-status-error-muted">${a}</p>`:null}
      </div>

      <div class="flex justify-end gap-2 pt-1">
        <${Z}
          onClick=${s}
          disabled=${e}
          loading=${!1}
          tone="secondary"
          size="sm"
          idleLabel="Cancel"
        />
        <${Z}
          onClick=${c}
          disabled=${e}
          loading=${e}
          tone="primary"
          size="sm"
          idleLabel="Save"
          loadingLabel="Saving..."
        />
      </div>
    </${De}>
  `};var ly=P.bind(T),$2=t=>{let e=String(t||"").trim();if(!e)return"";let n=e.match(/[\\/]\.openclaw[\\/](.+)$/);if(n?.[1])return String(n[1]).replace(/\\/g,"/");let s=e.split(/[\\/]/).filter(Boolean);return s[s.length-1]||""},cy=({agents:t=[],loading:e=!1,saving:n=!1,agentsActions:s={},selectedAgentId:o="",activeTab:r="overview",onSelectAgent:i=()=>{},onSelectTab:a=()=>{},onNavigateToBrowseFile:l=()=>{},onSetLocation:c=()=>{}})=>{let{create:d,remove:u,setDefault:p,update:f}=s,[g,m]=y(!1),[h,b]=y(null),[x,v]=y(null);L(()=>{let O=()=>m(!0);return window.addEventListener("alphaclaw:create-agent",O),()=>window.removeEventListener("alphaclaw:create-agent",O)},[]);let w=t.find(O=>O.id===o)||null,$=async({id:O,name:D,workspaceFolder:z})=>{try{let E=await d({id:O,name:D,workspaceFolder:z});m(!1),i(E.id),N("Agent created","success")}catch(E){N(E.message||"Could not create agent","error")}},S=async O=>{try{await p(O),N("Default agent updated","success")}catch(D){N(D.message||"Could not set default agent","error")}},C=async(O,D,z="Agent updated")=>{try{let E=await f(O,D);return N(z,"success"),E}catch(E){throw N(E.message||"Could not update agent","error"),E}},_=async({id:O,patch:D})=>{try{await C(O,D),b(null)}catch{return}},k=async({id:O,keepWorkspace:D})=>{try{await u(O,{keepWorkspace:D}),v(null),N("Agent deleted","success")}catch(z){N(z.message||"Could not delete agent","error")}},A=O=>{let D=$2(O);D&&l(D,{view:"edit",directory:!0})};return e?ly`
      <div class="agents-detail-panel">
        <div class="flex items-center justify-center w-full py-16">
          <${Ce} className="h-5 w-5" />
        </div>
      </div>
    `:ly`
    <${ty}
      agent=${w}
      agents=${t}
      activeTab=${r}
      saving=${n}
      onUpdateAgent=${C}
      onSetLocation=${c}
      onSelectTab=${a}
      onEdit=${b}
      onDelete=${v}
      onSetDefault=${S}
      onOpenWorkspace=${A}
    />

    <${oy}
      visible=${g}
      loading=${n}
      onClose=${()=>m(!1)}
      onSubmit=${$}
    />
    <${ay}
      visible=${!!h}
      loading=${n}
      agent=${h}
      onClose=${()=>b(null)}
      onSubmit=${_}
    />
    <${iy}
      visible=${!!x}
      loading=${n}
      agent=${x}
      onCancel=${()=>v(null)}
      onConfirm=${k}
    />
  `};var w2=P.bind(T),au=({agents:t=[],loading:e=!1,saving:n=!1,agentsActions:s={},selectedAgentId:o="",activeTab:r="overview",onSelectAgent:i=()=>{},onSelectTab:a=()=>{},onNavigateToBrowseFile:l=()=>{},onSetLocation:c=()=>{}})=>w2`
  <${cy}
    agents=${t}
    loading=${e}
    saving=${n}
    agentsActions=${s}
    selectedAgentId=${o}
    activeTab=${r}
    onSelectAgent=${i}
    onSelectTab=${a}
    onNavigateToBrowseFile=${l}
    onSetLocation=${c}
  />
`;var on=P.bind(T),dy=({sqliteSummary:t,sqliteSelectedTable:e,setSqliteSelectedTable:n,sqliteTableOffset:s,setSqliteTableOffset:o,sqliteTableLoading:r,sqliteTableError:i,sqliteTableData:a,kSqlitePageSize:l})=>{let c=Array.isArray(a?.rows)?a.rows:[],d=Array.isArray(a?.columns)&&a.columns.length?a.columns:(t?.objects||[]).find(g=>g?.name===e)?.columns||[],u=Number(a?.totalRows||0),p=s>0,f=s+l<u;return on`
    <div class="file-viewer-sqlite-shell">
      ${t?.objects?.length?on`
            <div class="file-viewer-sqlite-layout">
              <div class="file-viewer-sqlite-list">
                ${t.objects.map(g=>on`
                    <button
                      type="button"
                      class=${`file-viewer-sqlite-card ${e===g.name?"is-active":""}`}
                      onclick=${()=>{!g?.name||e===g.name||(n(g.name),o(0))}}
                    >
                      <div class="file-viewer-sqlite-title">
                        <span>${g.name}</span>
                        <span class="file-viewer-sqlite-type">${g.type}</span>
                      </div>
                    </button>
                  `)}
              </div>
              <div class="file-viewer-sqlite-table-shell">
                ${e?on`
                      <div class="file-viewer-sqlite-table-header">
                        <span class="file-viewer-sqlite-table-name">
                          ${e}
                        </span>
                        <div class="file-viewer-sqlite-table-nav">
                          <button
                            type="button"
                            class="ac-btn-secondary text-xs px-2 py-1 rounded-md"
                            disabled=${!p}
                            onclick=${()=>o(g=>Math.max(0,g-l))}
                          >
                            Prev
                          </button>
                          <button
                            type="button"
                            class="ac-btn-secondary text-xs px-2 py-1 rounded-md"
                            disabled=${!f}
                            onclick=${()=>o(g=>g+l)}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                      <div class="file-viewer-sqlite-table-meta">
                        ${u?`${Math.min(s+1,u)}-${Math.min(s+l,u)} of ${u} rows`:"No rows"}
                      </div>
                      ${r?on`
                            <div class="file-viewer-loading-shell">
                              <${Ce} className="h-4 w-4" />
                            </div>
                          `:i?on`
                              <div class="file-viewer-state file-viewer-state-error">
                                ${i}
                              </div>
                            `:on`
                              <div class="file-viewer-sqlite-table-wrap">
                                <table class="file-viewer-sqlite-table">
                                  <thead>
                                    <tr>
                                      ${d.map(g=>on`<th>${g.name}</th>`)}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${c.length?c.map((g,m)=>on`
                                            <tr key=${m}>
                                              ${d.map(h=>{let b=g?.[h.name],x=b===null?"NULL":typeof b=="object"?JSON.stringify(b):String(b??"");return on`
                                                  <td title=${x}>
                                                    ${x}
                                                  </td>
                                                `})}
                                            </tr>
                                          `):on`
                                          <tr>
                                            <td colspan=${Math.max(1,d.length)}>
                                              <span class="file-viewer-sqlite-table-empty">
                                                No rows
                                              </span>
                                            </td>
                                          </tr>
                                        `}
                                  </tbody>
                                </table>
                              </div>
                            `}
                    `:on`
                      <div class="file-viewer-state">Select a table to view rows.</div>
                    `}
              </div>
            </div>
            <div class="file-viewer-sqlite-footer">
              ${t.truncated?`Showing ${t.objects.length} of ${t.totalObjects} tables/views`:`${t.totalObjects} tables/views`}
            </div>
          `:on`
            <div class="file-viewer-state">
              SQLite database loaded, but no tables/views were found.
            </div>
          `}
    </div>
  `};var In=P.bind(T),uy=({pathSegments:t,isDirty:e,isPreviewOnly:n,isDiffView:s,isMarkdownFile:o,viewMode:r,handleChangeViewMode:i,handleSave:a,handleDiscard:l,loading:c,canEditFile:d,isEditBlocked:u,isImageFile:p,isAudioFile:f,isSqliteFile:g,saving:m,deleting:h,restoring:b,canDeleteFile:x,isDeleteBlocked:v,isProtectedFile:w,canRestoreDeletedDiff:$,onRequestDelete:S,onRequestRestore:C})=>In`
  <div class="file-viewer-tabbar">
    <div class="file-viewer-tab active">
      <span class="file-icon">f</span>
      <span class="file-viewer-breadcrumb">
        ${t.map((_,k)=>In`
            <span class="file-viewer-breadcrumb-item">
              <span
                class=${k===t.length-1?"is-current":""}
              >
                ${_}
              </span>
              ${k<t.length-1&&In`<span class="file-viewer-sep">></span>`}
            </span>
          `)}
      </span>
      ${e?In`<span class="file-viewer-dirty-dot" aria-hidden="true"></span>`:null}
    </div>
    <div class="file-viewer-tabbar-spacer"></div>
    ${n?In`<div class="file-viewer-preview-pill">Preview</div>`:null}
    ${!s&&o&&In`
      <${Xe}
        className="mr-2.5"
        options=${[{label:"edit",value:"edit"},{label:"preview",value:"preview"}]}
        value=${r}
        onChange=${i}
      />
    `}
    ${s?null:!p&&!f&&!g?In`
            ${w?null:In`
                  <${Z}
                    onClick=${S}
                    disabled=${!x||h}
                    tone="secondary"
                    size="sm"
                    iconOnly=${!0}
                    idleLabel=""
                    idleIcon=${Aa}
                    idleIconClassName="file-viewer-icon-action-icon"
                    className="file-viewer-save-action"
                    title=${v?"Locked files cannot be deleted":"Delete file"}
                    ariaLabel="Delete file"
                  />
                `}
            ${e?In`
                  <${Z}
                    onClick=${l}
                    disabled=${c||!d||u||h||m}
                    tone="secondary"
                    size="sm"
                    idleLabel="Discard changes"
                    className="file-viewer-save-action"
                  />
                `:null}
            <${Z}
              onClick=${a}
              disabled=${c||!e||!d||u}
              loading=${m}
              tone=${e?"primary":"secondary"}
              size="sm"
              idleLabel="Save"
              loadingLabel="Saving..."
              idleIcon=${fb}
              idleIconClassName="file-viewer-save-icon"
              className="file-viewer-save-action"
            />
          `:null}
    ${s&&$?In`
          <${Z}
            onClick=${C}
            disabled=${b}
            loading=${b}
            tone="secondary"
            size="sm"
            idleLabel="Restore"
            loadingLabel="Restoring..."
            idleIcon=${mb}
            idleIconClassName="file-viewer-save-icon"
            className="file-viewer-save-action"
          />
        `:null}
  </div>
`;var Go=P.bind(T),py=({isDiffView:t,onRequestEdit:e,normalizedPath:n,isDeletedDiff:s=!1,isLockedFile:o,isProtectedFile:r,isProtectedLocked:i,handleEditProtectedFile:a})=>Go`
  ${t?Go`
        <div class="file-viewer-protected-banner file-viewer-diff-banner">
          <div class="file-viewer-protected-banner-text">Viewing unsynced changes</div>
          ${s?null:Go`
                <${Z}
                  onClick=${()=>e(n)}
                  tone="secondary"
                  size="sm"
                  idleLabel="View file"
                />
              `}
        </div>
      `:null}
  ${!t&&o?Go`
        <div class="file-viewer-protected-banner is-locked">
          <${Oo} className="file-viewer-protected-banner-icon" />
          <div class="file-viewer-protected-banner-text">
            This file is managed by AlphaClaw and cannot be edited.
          </div>
        </div>
      `:null}
  ${!t&&r?Go`
        <div class="file-viewer-protected-banner">
          <div class="file-viewer-protected-banner-text">
            Protected file. Changes may break workspace behavior.
          </div>
          ${i?Go`
                <${Z}
                  onClick=${a}
                  tone="warning"
                  size="sm"
                  idleLabel="Edit anyway"
                />
              `:null}
        </div>
      `:null}
`;var lu=t=>{let e=String(t||"");if(!(e.startsWith(`---
`)||e==="---"))return{entries:[],body:e};let n=e.split(`
`);if(n[0]!=="---")return{entries:[],body:e};let s=n.findIndex((a,l)=>l>0&&a==="---");if(s===-1)return{entries:[],body:e};let o=n.slice(1,s),r=n.slice(s+1);return{entries:o.map(a=>{let l=a.indexOf(":");if(l<=0)return null;let c=a.slice(0,l).trim(),d=a.slice(l+1).trim();return c?{key:c,rawValue:d}:null}).filter(a=>a!==null),body:r.join(`
`).replace(/^\n+/,"")}},cu=t=>{let e=String(t||"").trim();if(!e)return e;if(e.startsWith("{")&&e.endsWith("}")||e.startsWith("[")&&e.endsWith("]"))try{let n=JSON.parse(e);return JSON.stringify(n,null,2)}catch{return e}return e};var He=t=>String(t||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"),qo=(t,e)=>String(t||"").split(`
`).map((n,s)=>({lineNumber:s+1,html:e(n)}));var k2=/(^|[^\w.#-])(-?\d+(?:\.\d+)?(?:px|em|rem|vh|vw|%|deg|s|ms)?)(?=$|[^\w-])/g,S2=t=>{let e=He(t);return e=e.replace(/@[a-zA-Z-]+/g,'<span class="hl-keyword">$&</span>'),e=e.replace(/#[0-9a-fA-F]{3,8}\b/g,'<span class="hl-number">$&</span>'),e=e.replace(k2,'$1<span class="hl-number">$2</span>'),e=e.replace(/(^|[;{\s])([a-zA-Z-]+)(\s*:)/g,'$1<span class="hl-attr">$2</span>$3'),e},C2=(t,e,n)=>{let s=e+1;for(;s<t.length;){if(t[s]==="\\"&&s+1<t.length){s+=2;continue}if(t[s]===n)return s;s+=1}return-1},_2=(t,e)=>{let n=String(t||""),s=[],o=0,r=e;for(;o<n.length;){if(r){let f=n.indexOf("*/",o);if(f===-1)return s.push({kind:"comment",value:n.slice(o)}),{parts:s,inBlockComment:!0};s.push({kind:"comment",value:n.slice(o,f+2)}),o=f+2,r=!1;continue}let i=n.indexOf("/*",o),a=n.indexOf("'",o),l=n.indexOf('"',o),c=[i,a,l].filter(f=>f!==-1);if(c.length===0){s.push({kind:"text",value:n.slice(o)});break}let d=Math.min(...c);if(d>o&&(s.push({kind:"text",value:n.slice(o,d)}),o=d),i===d){let f=n.indexOf("*/",d+2);if(f===-1){s.push({kind:"comment",value:n.slice(d)}),r=!0;break}s.push({kind:"comment",value:n.slice(d,f+2)}),o=f+2;continue}let u=n[d],p=C2(n,d,u);if(p===-1){s.push({kind:"string",value:n.slice(d)});break}s.push({kind:"string",value:n.slice(d,p+1)}),o=p+1}return{parts:s,inBlockComment:r}},al=(t,e={inBlockComment:!1})=>{let n=_2(t,!!e?.inBlockComment);return{html:n.parts.map(o=>o.kind==="comment"?`<span class="hl-comment">${He(o.value)}</span>`:o.kind==="string"?`<span class="hl-string">${He(o.value)}</span>`:S2(o.value)).join(""),state:{inBlockComment:n.inBlockComment}}},fy=t=>{let e=String(t||"").split(`
`),n={inBlockComment:!1};return e.map((s,o)=>{let r=al(s,n);return n=r.state,{lineNumber:o+1,html:r.html}})};var M2=/\b(await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|if|import|in|instanceof|let|new|of|return|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/g,A2=/(^|[^\w.])(-?(?:0x[a-fA-F0-9]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?))(?=$|[^\w.])/g,T2=t=>{let e=He(t);return e=e.replace(M2,'<span class="hl-keyword">$1</span>'),e=e.replace(/\b(true|false)\b/g,'<span class="hl-boolean">$1</span>'),e=e.replace(/\b(null|undefined)\b/g,'<span class="hl-null">$1</span>'),e=e.replace(A2,'$1<span class="hl-number">$2</span>'),e},P2=(t,e,n)=>{let s=e+1;for(;s<t.length;){if(t[s]==="\\"&&s+1<t.length){s+=2;continue}if(t[s]===n)return s;s+=1}return-1},R2=(t,e)=>{let n=String(t||""),s=[],o=0,r=e;for(;o<n.length;){if(r){let m=n.indexOf("*/",o);if(m===-1)return s.push({kind:"comment",value:n.slice(o)}),{parts:s,inBlockComment:!0};s.push({kind:"comment",value:n.slice(o,m+2)}),o=m+2,r=!1;continue}let i=n.indexOf("//",o),a=n.indexOf("/*",o),l=n.indexOf("'",o),c=n.indexOf('"',o),d=n.indexOf("`",o),u=[i,a,l,c,d].filter(m=>m!==-1);if(u.length===0){s.push({kind:"text",value:n.slice(o)});break}let p=Math.min(...u);if(p>o&&(s.push({kind:"text",value:n.slice(o,p)}),o=p),i===p){s.push({kind:"comment",value:n.slice(p)});break}if(a===p){let m=n.indexOf("*/",p+2);if(m===-1){s.push({kind:"comment",value:n.slice(p)}),r=!0;break}s.push({kind:"comment",value:n.slice(p,m+2)}),o=m+2;continue}let f=n[p],g=P2(n,p,f);if(g===-1){s.push({kind:"string",value:n.slice(p)});break}s.push({kind:"string",value:n.slice(p,g+1)}),o=g+1}return{parts:s,inBlockComment:r}},ll=(t,e={inBlockComment:!1})=>{let n=R2(t,!!e?.inBlockComment);return{html:n.parts.map(o=>o.kind==="comment"?`<span class="hl-comment">${He(o.value)}</span>`:o.kind==="string"?`<span class="hl-string">${He(o.value)}</span>`:T2(o.value)).join(""),state:{inBlockComment:n.inBlockComment}}},hy=t=>{let e=String(t||"").split(`
`),n={inBlockComment:!1};return e.map((s,o)=>{let r=ll(s,n);return n=r.state,{lineNumber:o+1,html:r.html}})};var my=t=>He(t).replace(/(&[a-zA-Z][a-zA-Z0-9]+;|&#\d+;|&#x[0-9a-fA-F]+;)/g,'<span class="hl-entity">$1</span>'),L2=t=>{let e=t.match(/^\s*/)?.[0]||"",n=t.slice(e.length);return`${He(e)}<span class="hl-string">${He(n)}</span>`},E2=t=>{let e=/([:@A-Za-z_][\w:.-]*)(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g,n="",s=0,o=e.exec(t);for(;o;){let r=o[0],i=o[1],a=o[2]||"",l=o.index,c=l+r.length;if(l>s&&(n+=He(t.slice(s,l))),n+=`<span class="hl-attr">${He(i)}</span>`,a){let d=a.indexOf("=");if(d!==-1){let u=a.slice(0,d),p=a.slice(d+1);n+=`${He(u)}<span class="hl-punc">=</span>${L2(p)}`}else n+=He(a)}s=c,o=e.exec(t)}return s<t.length&&(n+=He(t.slice(s))),n},I2=t=>{if(/^<!--[\s\S]*-->$/.test(t)||/^<!DOCTYPE/i.test(t))return`<span class="hl-meta">${He(t)}</span>`;let e=t.match(/^<\s*(\/?)\s*([A-Za-z][\w:-]*)([\s\S]*?)(\/?)\s*>$/);if(!e)return`<span class="hl-tag">${He(t)}</span>`;let n=e[1]==="/",s=e[2],o=e[3]||"",r=e[4]==="/",i=n?"&lt;/":"&lt;",a=n?"":E2(o),l=r?"/&gt;":"&gt;";return`<span class="hl-punc">${i}</span><span class="hl-tag">${He(s)}</span>${a}<span class="hl-punc">${l}</span>`},ai=t=>{let e=/<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<\/?[A-Za-z][^>]*>/gi,n=String(t||""),s="",o=0,r=e.exec(n);for(;r;){let i=r[0],a=r.index,l=a+i.length;a>o&&(s+=my(n.slice(o,a))),s+=I2(i),o=l,r=e.exec(n)}return o<n.length&&(s+=my(n.slice(o))),s},cl=(t,e)=>{let s=new RegExp(`<\\/?\\s*${e}\\b[^>]*>`,"ig").exec(t);return s?{text:s[0],start:s.index,end:s.index+s[0].length,isClosing:/^<\s*\//.test(s[0])}:null},D2=(t,e)=>{let n="",s=0,o=e.mode,r=e.languageState;for(;s<t.length;){if(o==="script"){let f=cl(t.slice(s),"script");if(!f||!f.isClosing){let x=ll(t.slice(s),r);n+=x.html,r=x.state,s=t.length;break}let g=s+f.start,m=s+f.end,h=t.slice(s,g),b=ll(h,r);n+=b.html,n+=ai(t.slice(g,m)),o="html",r={inBlockComment:!1},s=m;continue}if(o==="style"){let f=cl(t.slice(s),"style");if(!f||!f.isClosing){let x=al(t.slice(s),r);n+=x.html,r=x.state,s=t.length;break}let g=s+f.start,m=s+f.end,h=t.slice(s,g),b=al(h,r);n+=b.html,n+=ai(t.slice(g,m)),o="html",r={inBlockComment:!1},s=m;continue}let i=t.slice(s),a=cl(i,"script"),l=cl(i,"style"),c=[a,l].filter(f=>f&&!f.isClosing).sort((f,g)=>f.start-g.start);if(c.length===0){n+=ai(i),s=t.length;break}let d=c[0],u=s+d.start,p=s+d.end;n+=ai(t.slice(s,u)),n+=ai(t.slice(u,p)),o=/<\s*script\b/i.test(d.text)?"script":"style",r={inBlockComment:!1},s=p}return{html:n,state:{mode:o,languageState:r}}},gy=t=>{let e=String(t||"").split(`
`),n={mode:"html",languageState:{inBlockComment:!1}};return e.map((s,o)=>{let r=D2(s,n);return n=r.state,{lineNumber:o+1,html:r.html}})};var N2=t=>{let e=[],n=String(t||""),s=/"([^"\\]|\\.)*"/g,o=0,r=s.exec(n);for(;r;){let i=r.index,a=s.lastIndex,l=r[0],c=n.slice(a),d=/^\s*:/.test(c);i>o&&e.push({kind:"text",value:n.slice(o,i)}),e.push({kind:d?"key":"string",value:l}),o=a,r=s.exec(n)}return o<n.length&&e.push({kind:"text",value:n.slice(o)}),e.length===0?[{kind:"text",value:n}]:e},O2=t=>{let e=He(t);return e=e.replace(/(^|[^\w.])(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(?=$|[^\w.])/g,'$1<span class="hl-number">$2</span>'),e=e.replace(/\b(true|false)\b/g,'<span class="hl-boolean">$1</span>'),e=e.replace(/\bnull\b/g,'<span class="hl-null">null</span>'),e=e.replace(/([{}\[\],:])/g,'<span class="hl-punc">$1</span>'),e},B2=t=>N2(t).map(e=>e.kind==="key"?`<span class="hl-key">${He(e.value)}</span>`:e.kind==="string"?`<span class="hl-string">${He(e.value)}</span>`:O2(e.value)).join(""),by=t=>qo(t,B2);var xy=t=>{let e=He(t);return e=e.replace(/`([^`]+)`/g,'<span class="hl-string">`$1`</span>'),e=e.replace(/\*\*([^*]+)\*\*/g,'<span class="hl-bold">**$1**</span>'),e=e.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<span class="hl-link">[$1]($2)</span>'),e},F2=t=>/^#{1,6}\s/.test(t)?`<span class="hl-heading">${He(t)}</span>`:/^>\s/.test(t)?`<span class="hl-comment">${He(t)}</span>`:/^```/.test(t)?`<span class="hl-meta">${He(t)}</span>`:/^\|[-\s|]+\|$/.test(t)?`<span class="hl-meta">${He(t)}</span>`:/^\s*[-*]\s/.test(t)?xy(t).replace(/^(\s*)([-*])/,'$1<span class="hl-bullet">$2</span>'):xy(t),yy=t=>qo(t,F2);var vy=t=>{let n=String(t||"").toLowerCase().replace(/(\.bak)+$/i,"");return/\.(md|markdown|mdx)$/i.test(n)?"markdown":/\.(json|jsonl)$/i.test(n)?"json":/\.(html|htm)$/i.test(n)?"html":/\.(js|mjs|cjs)$/i.test(n)?"javascript":/\.(css|scss)$/i.test(n)?"css":"plain"},dl=(t,e)=>e==="markdown"?yy(t):e==="json"?by(t):e==="html"?gy(t):e==="javascript"?hy(t):e==="css"?fy(t):qo(t,n=>He(n));var li=P.bind(T),$y=({isMarkdownFile:t,parsedFrontmatter:e,frontmatterCollapsed:n,setFrontmatterCollapsed:s})=>!t||e.entries.length<=0?null:li`
    <div class="frontmatter-box">
      <button
        type="button"
        class="frontmatter-title"
        onclick=${()=>s(o=>!o)}
      >
        <span
          class=${`frontmatter-chevron ${n?"":"open"}`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" focusable="false">
            <path d="M7 4l6 6-6 6" />
          </svg>
        </span>
        <span>frontmatter</span>
      </button>
      ${n?null:li`
            <div class="frontmatter-grid">
              ${e.entries.map(o=>{let r=cu(o.rawValue),i=r.includes(`
`);return li`
                  <div class="frontmatter-row" key=${o.key}>
                    <div class="frontmatter-key">${o.key}</div>
                    ${i?li`
                          <pre class="frontmatter-value frontmatter-value-pre">
${r}</pre
                          >
                        `:li`<div class="frontmatter-value">${r}</div>`}
                  </div>
                `})}
            </div>
          `}
    </div>
  `;var ci=P.bind(T),H2=t=>t.startsWith("+")&&!t.startsWith("+++")?"is-added":t.startsWith("-")&&!t.startsWith("---")?"is-removed":t.startsWith("@@")?"is-hunk":t.startsWith("diff ")||t.startsWith("index ")||t.startsWith("--- ")||t.startsWith("+++ ")?"is-header":"",wy=({diffLoading:t,diffError:e,diffContent:n})=>ci`
  <div class="file-viewer-diff-shell">
    ${t?ci`
          <div class="file-viewer-loading-shell">
            <${Ce} className="h-4 w-4" />
          </div>
        `:e?ci`<div class="file-viewer-state file-viewer-state-error">${e}</div>`:ci`
            <pre class="file-viewer-diff-pre">
${(n||"").split(`
`).map((s,o)=>ci`
                <div
                  key=${`${o}:${s.slice(0,20)}`}
                  class=${`file-viewer-diff-line ${H2(s)}`.trim()}
                >
                  ${s||" "}
                </div>
              `)}
          </pre
            >
          `}
  </div>
`;var Jo=P.bind(T),ky=({isImageFile:t,imageDataUrl:e,pathSegments:n,isAudioFile:s,audioDataUrl:o})=>t?Jo`
      <div class="file-viewer-image-shell">
        ${e?Jo`
              <img
                src=${e}
                alt=${n[n.length-1]||"Selected image"}
                class="file-viewer-image"
              />
            `:Jo`<div class="file-viewer-state">Could not render image preview.</div>`}
      </div>
    `:s?Jo`
      <div class="file-viewer-audio-shell">
        ${o?Jo`
              <audio class="file-viewer-audio-player" controls preload="metadata" src=${o}>
                Your browser does not support audio playback.
              </audio>
            `:Jo`<div class="file-viewer-state">Could not render audio preview.</div>`}
      </div>
    `:null;var Zo=P.bind(T),Sy=({overlay:t=!1,editorTextareaRef:e,renderContent:n,handleContentInput:s,handleEditorKeyDown:o,handleEditorScroll:r,handleEditorSelectionChange:i,isEditBlocked:a,isPreviewOnly:l,textareaWrap:c="soft"})=>Zo`
  <textarea
    class=${t?"file-viewer-editor file-viewer-editor-overlay":"file-viewer-editor"}
    ref=${e}
    value=${n}
    onInput=${s}
    onKeyDown=${o}
    onScroll=${r}
    onSelect=${i}
    onKeyUp=${i}
    onClick=${i}
    disabled=${a||l}
    readonly=${a||l}
    spellcheck=${!1}
    autocorrect="off"
    autocapitalize="off"
    autocomplete="off"
    data-gramm="false"
    data-gramm_editor="false"
    data-enable-grammarly="false"
    wrap=${c}
  ></textarea>
`,Yo=({editorShellClassName:t="file-viewer-editor-shell",editorShellAriaHidden:e,editorLineNumbers:n,editorLineNumbersRef:s,editorLineNumberRowRefs:o,shouldUseHighlightedEditor:r,highlightedEditorLines:i,editorHighlightRef:a,editorHighlightLineRefs:l,editorTextareaRef:c,renderContent:d,handleContentInput:u,handleEditorKeyDown:p,handleEditorScroll:f,handleEditorSelectionChange:g,isEditBlocked:m,isPreviewOnly:h,textareaWrap:b="soft"})=>Zo`
  <div class=${t} aria-hidden=${e}>
    <div class="file-viewer-editor-line-num-col" ref=${s}>
      ${n.map(x=>Zo`
          <div
            class="file-viewer-editor-line-num"
            key=${x}
            data-line-row
            ref=${v=>{o.current[x-1]=v}}
          >
            ${x}
          </div>
        `)}
    </div>
    ${r?Zo`
          <div class="file-viewer-editor-stack">
            <div class="file-viewer-editor-highlight" ref=${a}>
              ${i.map(x=>Zo`
                  <div
                    class="file-viewer-editor-highlight-line"
                    key=${x.lineNumber}
                    ref=${v=>{l.current[x.lineNumber-1]=v}}
                  >
                    <span
                      class="file-viewer-editor-highlight-line-content"
                      dangerouslySetInnerHTML=${{__html:x.html}}
                    ></span>
                  </div>
                `)}
            </div>
            <${Sy}
              overlay=${!0}
              editorTextareaRef=${c}
              renderContent=${d}
              handleContentInput=${u}
              handleEditorKeyDown=${p}
              handleEditorScroll=${f}
              handleEditorSelectionChange=${g}
              isEditBlocked=${m}
              isPreviewOnly=${h}
              textareaWrap=${b}
            />
          </div>
        `:Zo`
          <${Sy}
            overlay=${!1}
            editorTextareaRef=${c}
            renderContent=${d}
            handleContentInput=${u}
            handleEditorKeyDown=${p}
            handleEditorScroll=${f}
            handleEditorSelectionChange=${g}
            isEditBlocked=${m}
            isPreviewOnly=${h}
            textareaWrap=${b}
          />
        `}
  </div>
`;var W2=P.bind(T),Cy=({viewMode:t,previewRef:e,handlePreviewScroll:n,previewHtml:s,editorLineNumbers:o,editorLineNumbersRef:r,editorLineNumberRowRefs:i,shouldUseHighlightedEditor:a,highlightedEditorLines:l,editorHighlightRef:c,editorHighlightLineRefs:d,editorTextareaRef:u,renderContent:p,handleContentInput:f,handleEditorKeyDown:g,handleEditorScroll:m,handleEditorSelectionChange:h,isEditBlocked:b,isPreviewOnly:x})=>W2`
  <div
    class=${`file-viewer-preview ${t==="preview"?"":"file-viewer-pane-hidden"}`}
    ref=${e}
    onscroll=${n}
    aria-hidden=${t==="preview"?"false":"true"}
    dangerouslySetInnerHTML=${{__html:s}}
  ></div>
  <${Yo}
    editorShellClassName=${`file-viewer-editor-shell ${t==="edit"?"":"file-viewer-pane-hidden"}`}
    editorShellAriaHidden=${t==="edit"?"false":"true"}
    editorLineNumbers=${o}
    editorLineNumbersRef=${r}
    editorLineNumberRowRefs=${i}
    shouldUseHighlightedEditor=${a}
    highlightedEditorLines=${l}
    editorHighlightRef=${c}
    editorHighlightLineRefs=${d}
    editorTextareaRef=${u}
    renderContent=${p}
    handleContentInput=${f}
    handleEditorKeyDown=${g}
    handleEditorScroll=${m}
    handleEditorSelectionChange=${h}
    isEditBlocked=${b}
    isPreviewOnly=${x}
  />
`;var _y=1e3,My=5e3,ul=50,pl=25e4,fl=5e3;var Ay=()=>{try{return String(window.localStorage.getItem(Jr)||"").trim()==="preview"?"preview":"edit"}catch{return"edit"}},Ty=()=>{try{let t=window.localStorage.getItem(Ba);if(!t)return{};let e=JSON.parse(t);return!e||typeof e!="object"?{}:e}catch{return{}}},Py=t=>{let e=String(t||"").trim();if(!e)return null;let s=Ty()[e];return!s||typeof s!="object"?null:{start:s.start,end:s.end}},du=(t,e)=>{let n=String(t||"").trim();if(!(!n||!e||typeof e!="object"))try{let s=Ty();s[n]={start:e.start,end:e.end},window.localStorage.setItem(Ba,JSON.stringify(s))}catch{}};var Ry=t=>String(t||"").split("/").map(e=>e.trim()).filter(Boolean),hl=(t,e)=>{let n=Number.parseInt(String(t??""),10);return Number.isFinite(n)?Math.max(0,Math.min(e,n)):0},ml=t=>{let e=String(t||"");return e?e.split(/\r\n|\r|\n/).length:1},gl=({contentLength:t=0,lineCount:e=1,charThreshold:n=25e4,lineThreshold:s=5e3})=>Number(t)>Number(n)||Number(e)>Number(s);var Xo=t=>{if(!t)return 0;let e=t.scrollHeight-t.clientHeight;return e<=0?0:t.scrollTop/e},$s=(t,e)=>{if(!t)return;let n=t.scrollHeight-t.clientHeight;if(n<=0){t.scrollTop=0;return}let s=Math.max(0,Math.min(1,e));t.scrollTop=n*s},Ly=({viewMode:t,setViewMode:e,previewRef:n,editorTextareaRef:s,editorLineNumbersRef:o,editorHighlightRef:r})=>{let i=ee(0),a=ee(!1);return{viewScrollRatioRef:i,isSyncingScrollRef:a,handleEditorScroll:u=>{if(a.current)return;let p=u.currentTarget.scrollTop,f=Xo(u.currentTarget);i.current=f,o.current&&(o.current.scrollTop=p,r.current&&(r.current.scrollTop=p,r.current.scrollLeft=u.currentTarget.scrollLeft),n.current&&(a.current=!0,$s(n.current,f),window.requestAnimationFrame(()=>{a.current=!1})))},handlePreviewScroll:u=>{if(a.current)return;let p=Xo(u.currentTarget);i.current=p,a.current=!0,$s(s.current,p),$s(o.current,p),$s(r.current,p),window.requestAnimationFrame(()=>{a.current=!1})},handleChangeViewMode:u=>{if(u===t)return;let p=Xo(t==="preview"?n.current:s.current);i.current=p,e(u),window.requestAnimationFrame(()=>{a.current=!0,u==="preview"?$s(n.current,p):($s(s.current,p),$s(o.current,p),$s(r.current,p)),window.requestAnimationFrame(()=>{a.current=!1})})}}};var Ey=({hasSelectedPath:t,normalizedPath:e,isDiffView:n,isSqliteFile:s,sqliteSelectedTable:o,sqliteTableOffset:r,canEditFile:i,isFolderPath:a,loading:l,saving:c,initialContent:d,isDirty:u,setContent:p,setInitialContent:f,setFileKind:g,setImageDataUrl:m,setAudioDataUrl:h,setSqliteSummary:b,setSqliteSelectedTable:x,setSqliteTableOffset:v,setSqliteTableLoading:w,setSqliteTableError:$,setSqliteTableData:S,setError:C,setIsFolderPath:_,setExternalChangeNoticeShown:k,externalChangeNoticeShown:A,viewScrollRatioRef:O,setLoading:D})=>{let z=ee(""),E=ee(""),M=ee(!1);return L(()=>{let R=!0;return z.current="",E.current="",t?(p(""),f(""),m(""),h(""),b(null),x(""),v(0),w(!1),$(""),S(null),g("text"),C(""),_(!1),k(!1),O.current=0,n?(D(!1),z.current=e,E.current="",()=>{R=!1}):((async()=>{D(!0),C(""),_(!1);try{let I=await ud(e);if(!R)return;let U=I?.kind==="image"?"image":I?.kind==="audio"?"audio":I?.kind==="sqlite"?"sqlite":"text";if(g(U),U==="image"){m(String(I?.imageDataUrl||"")),h(""),b(null),x(""),v(0),w(!1),$(""),S(null),p(""),f(""),k(!1),O.current=0,z.current=e,E.current="";return}if(U==="audio"){h(String(I?.audioDataUrl||"")),m(""),b(null),x(""),v(0),w(!1),$(""),S(null),p(""),f(""),k(!1),O.current=0,z.current=e,E.current="";return}if(U==="sqlite"){let se=I?.sqliteSummary||null,K=se?.objects||[],j=K.find(X=>X?.type==="table")?.name||K[0]?.name||"";b(se),x(j),v(0),w(!1),$(""),S(null),m(""),h(""),p(""),f(""),k(!1),O.current=0,z.current=e,E.current="";return}m(""),h(""),b(null),x(""),v(0),w(!1),$(""),S(null);let W=I.content||"",G=zb(e);p(G||W),mn(e,!!(G&&G!==W),{dispatchEvent:se=>window.dispatchEvent(se)}),f(W),k(!1),O.current=0,z.current=e,E.current=""}catch(I){if(!R)return;g("text"),m(""),h(""),b(null),x(""),v(0),w(!1),$(""),S(null);let U=I.message||"Could not load file";if(/path is not a file/i.test(U)){p(""),f(""),_(!0),C(""),z.current=e,E.current="";return}C(U)}finally{R&&D(!1)}})(),()=>{R=!1})):(p(""),f(""),g("text"),m(""),h(""),b(null),x(""),v(0),w(!1),$(""),S(null),C(""),_(!1),O.current=0,z.current="",()=>{R=!1})},[t,e,n]),L(()=>{if(!s||!e||!o)return S(null),$(""),w(!1),()=>{};let R=!0;return(async()=>{w(!0),$("");try{let I=await hg({filePath:e,table:o,limit:ul,offset:r});if(!R)return;S(I)}catch(I){if(!R)return;$(I.message||"Could not load sqlite table")}finally{R&&w(!1)}})(),()=>{R=!1}},[s,e,o,r]),L(()=>{if(!t||a||!i||n)return()=>{};let R=async()=>{if(!(l||c)&&!M.current){M.current=!0;try{let U=(await ud(e)).content||"";if(U===d){k(!1);return}if(!u){p(U),f(U),xs(e),mn(e,!1,{dispatchEvent:W=>window.dispatchEvent(W)}),k(!1),window.dispatchEvent(new CustomEvent("alphaclaw:browse-tree-refresh"));return}A||(N("This file changed on disk. Save to overwrite or reload by re-opening.","error"),k(!0))}catch{}finally{M.current=!1}}},B=window.setInterval(R,My);return()=>{window.clearInterval(B)}},[t,a,i,n,l,c,e,d,u,A]),{loadedFilePathRef:z,restoredSelectionPathRef:E}};var Iy=({hasSelectedPath:t,isDiffView:e,isPreviewOnly:n,normalizedPath:s})=>{let[o,r]=y(!1),[i,a]=y(""),[l,c]=y(""),[d,u]=y({statusKind:"",isDeleted:!1});return L(()=>{let p=!0;return!t||!e||n?(r(!1),a(""),c(""),u({statusKind:"",isDeleted:!1}),()=>{p=!1}):((async()=>{r(!0),a("");try{let g=await fg(s);if(!p)return;c(String(g?.content||"")),u({statusKind:String(g?.statusKind||""),isDeleted:!!g?.isDeleted})}catch(g){if(!p)return;a(g.message||"Could not load diff"),u({statusKind:"",isDeleted:!1})}finally{p&&r(!1)}})(),()=>{p=!1})},[t,e,n,s]),{diffLoading:o,diffError:i,diffContent:l,diffStatus:d}};var Dy=({loadedFilePathRef:t,normalizedPath:e,canEditFile:n,hasSelectedPath:s,loading:o,content:r,initialContent:i})=>{L(()=>{if(t.current===e&&!(!n||!s||o)){if(r===i){xs(e),mn(e,!1,{dispatchEvent:a=>window.dispatchEvent(a)});return}za(e,r),mn(e,!0,{dispatchEvent:a=>window.dispatchEvent(a)})}},[n,s,o,r,i,e])};var Ny=({canEditFile:t,isPreviewOnly:e,isDiffView:n,viewMode:s,handleSave:o})=>{L(()=>{let r=i=>{(i.metaKey||i.ctrlKey)&&!i.shiftKey&&!i.altKey&&String(i.key||"").toLowerCase()==="s"&&(!t||e||n||s!=="edit"||(i.preventDefault(),o()))};return window.addEventListener("keydown",r),()=>window.removeEventListener("keydown",r)},[t,e,n,s,o])};var V2=(t,e)=>{let n=String(t||"").split(`
`),s=Math.max(0,Math.min(e-1,n.length-1)),o=0;for(let r=0;r<s;r+=1)o+=n[r].length+1;return o},Oy=({lineIndex:t,textareaElement:e,editorLineNumbersRef:n,editorHighlightRef:s,viewScrollRatioRef:o})=>{let r=window.getComputedStyle(e),i=Number.parseFloat(r.lineHeight||""),a=Number.isFinite(i)&&i>0?i:20,l=Math.max(0,t*a-e.clientHeight*.4);e.scrollTop=l,n.current&&(n.current.scrollTop=l),s.current&&(s.current.scrollTop=l),o.current=Xo(e)},By=t=>{if(!t)return;let e=t.querySelectorAll(".line-highlight-flash");for(let n of e)n.classList.remove("line-highlight-flash")},j2=(t,e,n)=>{if(!t)return;By(t);let s=t.querySelectorAll("[data-line-row]"),o=Math.min(n,s.length-1);for(let r=e;r<=o;r+=1){let i=s[r];i&&i.classList.add("line-highlight-flash")}},Fy=({canEditFile:t,isEditBlocked:e,loading:n,hasSelectedPath:s,normalizedPath:o,loadedFilePathRef:r,restoredSelectionPathRef:i,viewMode:a,content:l,lineTarget:c=0,lineEndTarget:d=0,editorTextareaRef:u,editorLineNumbersRef:p,editorHighlightRef:f,viewScrollRatioRef:g})=>{let m=ee("");L(()=>{c&&c>=1||m.current&&(By(p.current),m.current="")},[c,o,p]),L(()=>{if(e||!t||n||!s)return()=>{};if(r.current!==o)return()=>{};if(a!=="edit")return()=>{};if(!c||c<1)return()=>{};let h=d&&d>=c?d:c,b=`${o}:${c}-${h}`;if(m.current===b)return()=>{};let x=0,v=0,w=()=>{let $=u.current;if(!$){v+=1,v<6&&(x=window.requestAnimationFrame(w));return}let S=String(l||""),C=V2(S,c);$.setSelectionRange(C,C);let _=c-1,k=h-1;window.requestAnimationFrame(()=>{let A=u.current;A&&(Oy({lineIndex:_,textareaElement:A,editorLineNumbersRef:p,editorHighlightRef:f,viewScrollRatioRef:g}),j2(p.current,_,k))}),m.current=b,i.current=o};return x=window.requestAnimationFrame(w),()=>{x&&window.cancelAnimationFrame(x)}},[t,e,n,s,o,l,a,c,d,r,i,u,p,f,g]),L(()=>{if(e)return i.current="",()=>{};if(!t||n||!s)return()=>{};if(r.current!==o)return()=>{};if(i.current===o)return()=>{};if(a!=="edit")return()=>{};if(c&&c>=1)return()=>{};let h=Py(o);if(!h)return i.current=o,()=>{};let b=0,x=0,v=()=>{let w=u.current;if(!w){x+=1,x<6&&(b=window.requestAnimationFrame(v));return}let $=String(l||"").length,S=hl(h.start,$),C=hl(h.end,$);w.focus(),w.setSelectionRange(S,Math.max(S,C)),window.requestAnimationFrame(()=>{let _=u.current;if(!_)return;let k=String(l||""),A=hl(S,k.length),O=k.slice(0,A).split(`
`).length-1;Oy({lineIndex:O,textareaElement:_,editorLineNumbersRef:p,editorHighlightRef:f,viewScrollRatioRef:g})}),i.current=o};return b=window.requestAnimationFrame(v),()=>{b&&window.cancelAnimationFrame(b)}},[t,e,n,s,o,l,a,c,r,i,u,p,f,g])};var bl=({enabled:t=!1,syncKey:e="",editorLineNumberRowRefs:n,editorHighlightLineRefs:s})=>{let o=q(()=>{if(!t)return;let r=n?.current||[],i=s?.current||[],a=Math.min(r.length,i.length);for(let l=0;l<a;l+=1){let c=r[l],d=i[l];!c||!d||(c.style.height=`${d.offsetHeight}px`)}},[s,n,t]);return L(()=>{o()},[o,e]),L(()=>{if(!t)return()=>{};let r=()=>o();return window.addEventListener("resize",r),()=>window.removeEventListener("resize",r)},[t,o]),{syncEditorLineNumberHeights:o}};var Hy=({filePath:t="",isPreviewOnly:e=!1,browseView:n="edit",lineTarget:s=0,lineEndTarget:o=0,onRequestClearSelection:r=()=>{},onRequestEdit:i=()=>{}})=>{let a=String(t||"").trim(),l=Ys(a),[c,d]=y(""),[u,p]=y(""),[f,g]=y("text"),[m,h]=y(""),[b,x]=y(""),[v,w]=y(null),[$,S]=y(""),[C,_]=y(0),[k,A]=y(!1),[O,D]=y(""),[z,E]=y(null),[M,R]=y(Ay),[B,I]=y(!1),[U,W]=y(!1),[G,se]=y(!1),[K,j]=y(!1),[X,de]=y(!1),[le,ie]=y(""),[ne,xe]=y(!1),[he,ue]=y(!1),[me,V]=y(!1),[J,oe]=y(()=>new Set),ce=ee(null),be=ee(null),Ve=ee(null),et=ee(null),kt=ee([]),Ot=ee([]),Q=a.length>0,pe=f==="image",te=f==="audio",Ee=f==="sqlite",ke=Q&&!ne&&!e&&!pe&&!te&&!Ee,H=String(n||"edit")==="diff",{viewScrollRatioRef:re,handleEditorScroll:ye,handlePreviewScroll:ve,handleChangeViewMode:Ie}=Ly({viewMode:M,setViewMode:R,previewRef:et,editorTextareaRef:Ve,editorLineNumbersRef:ce,editorHighlightRef:be}),{loadedFilePathRef:gt,restoredSelectionPathRef:Hc}=Ey({hasSelectedPath:Q,normalizedPath:a,isDiffView:H,isSqliteFile:Ee,sqliteSelectedTable:$,sqliteTableOffset:C,canEditFile:ke,isFolderPath:ne,loading:B,saving:G,initialContent:u,isDirty:ke&&c!==u,setLoading:I,setContent:d,setInitialContent:p,setFileKind:g,setImageDataUrl:h,setAudioDataUrl:x,setSqliteSummary:w,setSqliteSelectedTable:S,setSqliteTableOffset:_,setSqliteTableLoading:A,setSqliteTableError:D,setSqliteTableData:E,setError:ie,setIsFolderPath:xe,setExternalChangeNoticeShown:V,externalChangeNoticeShown:me,viewScrollRatioRef:re}),{diffLoading:Wc,diffError:ea,diffContent:Vc,diffStatus:Cr}=Iy({hasSelectedPath:Q,isDiffView:H,isPreviewOnly:e,normalizedPath:a}),jc=F(()=>Ry(a),[a]),ta=gt.current===a,Kt=ta?c:"",go=ke&&Kt!==(ta?u:""),bo=ke&&Zn(Zs,l),_r=ke&&!bo&&Zn(Ua,l),na=_r&&!J.has(l),ps=bo||na,xo=bo||_r,Fs=Q&&!ne&&!e&&!H&&!K&&!G&&!xo,fs=F(()=>vy(a),[a]),Gn=fs==="markdown",yo=F(()=>ml(Kt),[Kt]),ge=F(()=>gl({contentLength:Kt.length,lineCount:yo,charThreshold:pl,lineThreshold:fl}),[Kt,yo]),bt=fs!=="plain"&&!ge,Pt=!ge,xt=F(()=>Gn?lu(Kt):{entries:[],body:Kt},[Kt,Gn]),fn=F(()=>bt?dl(Kt,fs):[],[Kt,bt,fs]),Ke=F(()=>Pt?Array.from({length:yo},(we,je)=>je+1):[],[yo,Pt]),St=F(()=>Gn?Le.parse(xt.body||"",{gfm:!0,breaks:!0}):"",[xt.body,Gn]);bl({enabled:bt&&M==="edit",syncKey:`${a}:${Kt.length}:${fn.length}`,editorLineNumberRowRefs:kt,editorHighlightLineRefs:Ot}),L(()=>{!Gn&&M!=="edit"&&R("edit")},[Gn,M]),L(()=>{oe(new Set)},[a]),L(()=>{try{window.localStorage.setItem(Jr,M)}catch{}},[M]),L(()=>{if(!B)return W(!1),()=>{};let we=window.setTimeout(()=>{W(!0)},_y);return()=>window.clearTimeout(we)},[B]),Dy({loadedFilePathRef:gt,normalizedPath:a,canEditFile:ke,hasSelectedPath:Q,loading:B,content:c,initialContent:u}),Fy({canEditFile:ke,isEditBlocked:ps,loading:B,hasSelectedPath:Q,normalizedPath:a,loadedFilePathRef:gt,restoredSelectionPathRef:Hc,viewMode:M,content:c,lineTarget:s,lineEndTarget:o,editorTextareaRef:Ve,editorLineNumbersRef:ce,editorHighlightRef:be,viewScrollRatioRef:re});let Gt=q(async()=>{if(!(!ke||G||!go||ps)){se(!0),ie("");try{await ag(a,c),p(c),V(!1),xs(a),mn(a,!1,{dispatchEvent:we=>window.dispatchEvent(we)}),window.dispatchEvent(new CustomEvent("alphaclaw:browse-file-saved",{detail:{path:a}}))}catch(we){let je=we.message||"Could not save file";N(je,"error")}finally{se(!1)}}},[ke,G,go,ps,a,c]),vo=q(async()=>{if(Fs){j(!0),ie("");try{let we=await wa(a),je=String(we?.path||a);V(!1),xs(a),mn(a,!1,{dispatchEvent:Mr=>window.dispatchEvent(Mr)}),window.dispatchEvent(new CustomEvent("alphaclaw:browse-file-saved",{detail:{path:je}})),window.dispatchEvent(new CustomEvent("alphaclaw:browse-file-deleted",{detail:{path:je}})),window.dispatchEvent(new CustomEvent("alphaclaw:browse-tree-refresh")),N("File deleted","success"),r()}catch(we){let je=we.message||"Could not delete file";ie(je),/path is not a file/i.test(je)?(N("Only files can be deleted","warning"),r()):N(je,"error")}finally{j(!1)}}},[Fs,a,r]),Hs=q(async()=>{if(!(!H||!Cr?.isDeleted||X)){de(!0);try{let we=await pg(a),je=String(we?.path||a);window.dispatchEvent(new CustomEvent("alphaclaw:browse-file-saved",{detail:{path:je}})),window.dispatchEvent(new CustomEvent("alphaclaw:browse-tree-refresh")),N("File restored","success"),i(je)}catch(we){N(we.message||"Could not restore file","error")}finally{de(!1)}}},[Cr?.isDeleted,H,a,i,X]);Ny({canEditFile:ke,isPreviewOnly:e,isDiffView:H,viewMode:M,handleSave:Gt});let kk=()=>{l&&(oe(we=>{let je=new Set(we);return je.add(l),je}),window.requestAnimationFrame(()=>{window.requestAnimationFrame(()=>{let we=Ve.current;we&&(we.disabled||we.readOnly||we.focus())})}))},jf=q((we,je=null)=>{!Q||!ke||(je&&du(a,je),za(a,we),mn(a,we!==u,{dispatchEvent:Mr=>window.dispatchEvent(Mr)}))},[Q,ke,a,u]);return{state:{hasSelectedPath:Q,isPreviewOnly:e,loading:B,saving:G,deleting:K,restoring:X,showDelayedLoadingSpinner:U,error:le,isFolderPath:ne,isImageFile:pe,imageDataUrl:m,isAudioFile:te,audioDataUrl:b,isSqliteFile:Ee,sqliteSummary:v,sqliteSelectedTable:$,sqliteTableOffset:C,sqliteTableLoading:k,sqliteTableError:O,sqliteTableData:z,isDiffView:H,diffLoading:Wc,diffError:ea,diffContent:Vc,diffStatus:Cr,isMarkdownFile:Gn,frontmatterCollapsed:he,previewHtml:St,viewMode:M,renderContent:Kt},derived:{pathSegments:jc,isDirty:go,canEditFile:ke,canDeleteFile:Fs,isDeleteBlocked:xo,isEditBlocked:ps,isLockedFile:bo,isProtectedFile:_r,isProtectedLocked:na,shouldUseHighlightedEditor:bt,shouldRenderLineNumbers:Pt,parsedFrontmatter:xt,highlightedEditorLines:fn,editorLineNumbers:Ke},refs:{previewRef:et,editorLineNumbersRef:ce,editorLineNumberRowRefs:kt,editorHighlightRef:be,editorHighlightLineRefs:Ot,editorTextareaRef:Ve},actions:{setFrontmatterCollapsed:ue,setSqliteSelectedTable:S,setSqliteTableOffset:_,handleChangeViewMode:Ie,handleSave:Gt,handleDiscard:()=>{!ke||!go||G||K||(d(u),xs(a),mn(a,!1,{dispatchEvent:we=>window.dispatchEvent(we)}),N("Changes discarded","info"))},handleDelete:vo,handleRestore:Hs,handleEditProtectedFile:kk,handleContentInput:we=>{if(ps||e)return;let je=we.target.value;d(je),jf(je,{start:we.target.selectionStart,end:we.target.selectionEnd})},handleEditorKeyDown:we=>{if(we.key!=="Tab"||we.shiftKey||we.metaKey||we.ctrlKey||we.altKey||ps||e||!ke)return;let je=we.currentTarget;if(!je)return;we.preventDefault();let Mr=Number(je.selectionStart||0),Sk=Number(je.selectionEnd||0);je.setRangeText("  ",Mr,Sk,"end");let zf=je.value;d(zf),jf(zf,{start:je.selectionStart,end:je.selectionEnd})},handleEditorScroll:ye,handlePreviewScroll:ve,handleEditorSelectionChange:()=>{if(!Q||!ke||B)return;let we=Ve.current;we&&du(a,{start:we.selectionStart,end:we.selectionEnd})}},context:{normalizedPath:a}}};var dn=P.bind(T),Wy=({filePath:t="",isPreviewOnly:e=!1,browseView:n="edit",lineTarget:s=0,lineEndTarget:o=0,onRequestEdit:r=()=>{},onRequestClearSelection:i=()=>{}})=>{let[a,l]=y(!1),{state:c,derived:d,refs:u,actions:p,context:f}=Hy({filePath:t,isPreviewOnly:e,browseView:n,lineTarget:s,lineEndTarget:o,onRequestClearSelection:i,onRequestEdit:r});return!c.hasSelectedPath||c.isFolderPath?dn`
      <div class="file-viewer-empty">
        <div class="file-viewer-empty-mark">[ ]</div>
        <div class="file-viewer-empty-title">Browse and edit files<br />Syncs to git</div>
      </div>
    `:dn`
    <div class="file-viewer">
      <${uy}
        pathSegments=${d.pathSegments}
        isDirty=${d.isDirty}
        isPreviewOnly=${c.isPreviewOnly}
        isDiffView=${c.isDiffView}
        isMarkdownFile=${c.isMarkdownFile}
        viewMode=${c.viewMode}
        handleChangeViewMode=${p.handleChangeViewMode}
        handleSave=${p.handleSave}
        handleDiscard=${p.handleDiscard}
        loading=${c.loading}
        canEditFile=${d.canEditFile}
        isEditBlocked=${d.isEditBlocked}
        isImageFile=${c.isImageFile}
        isAudioFile=${c.isAudioFile}
        isSqliteFile=${c.isSqliteFile}
        saving=${c.saving}
        deleting=${c.deleting}
        restoring=${c.restoring}
        canDeleteFile=${d.canDeleteFile}
        isDeleteBlocked=${d.isDeleteBlocked}
        isProtectedFile=${d.isProtectedFile}
        canRestoreDeletedDiff=${c.isDiffView&&!!c.diffStatus?.isDeleted}
        onRequestDelete=${()=>l(!0)}
        onRequestRestore=${p.handleRestore}
      />
      <${py}
        isDiffView=${c.isDiffView}
        onRequestEdit=${r}
        normalizedPath=${f.normalizedPath}
        isDeletedDiff=${!!c.diffStatus?.isDeleted}
        isLockedFile=${d.isLockedFile}
        isProtectedFile=${d.isProtectedFile}
        isProtectedLocked=${d.isProtectedLocked}
        handleEditProtectedFile=${p.handleEditProtectedFile}
      />
      ${c.isDiffView?null:dn`
            <${$y}
              isMarkdownFile=${c.isMarkdownFile}
              parsedFrontmatter=${d.parsedFrontmatter}
              frontmatterCollapsed=${c.frontmatterCollapsed}
              setFrontmatterCollapsed=${p.setFrontmatterCollapsed}
            />
          `}
      ${c.loading?dn`
            <div class="file-viewer-loading-shell">
              ${c.showDelayedLoadingSpinner?dn`<${Ce} className="h-4 w-4" />`:null}
            </div>
          `:c.error?dn`<div class="file-viewer-state file-viewer-state-error">${c.error}</div>`:c.isImageFile||c.isAudioFile?dn`
                  <${ky}
                    isImageFile=${c.isImageFile}
                    imageDataUrl=${c.imageDataUrl}
                    pathSegments=${d.pathSegments}
                    isAudioFile=${c.isAudioFile}
                    audioDataUrl=${c.audioDataUrl}
                  />
                `:c.isSqliteFile?dn`
                    <${dy}
                      sqliteSummary=${c.sqliteSummary}
                      sqliteSelectedTable=${c.sqliteSelectedTable}
                      setSqliteSelectedTable=${p.setSqliteSelectedTable}
                      sqliteTableOffset=${c.sqliteTableOffset}
                      setSqliteTableOffset=${p.setSqliteTableOffset}
                      sqliteTableLoading=${c.sqliteTableLoading}
                      sqliteTableError=${c.sqliteTableError}
                      sqliteTableData=${c.sqliteTableData}
                      kSqlitePageSize=${ul}
                    />
                  `:c.isDiffView?dn`
                      <${wy}
                        diffLoading=${c.diffLoading}
                        diffError=${c.diffError}
                        diffContent=${c.diffContent}
                      />
                    `:dn`
                      ${c.isMarkdownFile?dn`
                            <${Cy}
                              viewMode=${c.viewMode}
                              previewRef=${u.previewRef}
                              handlePreviewScroll=${p.handlePreviewScroll}
                              previewHtml=${c.previewHtml}
                              editorLineNumbers=${d.editorLineNumbers}
                              editorLineNumbersRef=${u.editorLineNumbersRef}
                              editorLineNumberRowRefs=${u.editorLineNumberRowRefs}
                              shouldUseHighlightedEditor=${d.shouldUseHighlightedEditor}
                              highlightedEditorLines=${d.highlightedEditorLines}
                              editorHighlightRef=${u.editorHighlightRef}
                              editorHighlightLineRefs=${u.editorHighlightLineRefs}
                              editorTextareaRef=${u.editorTextareaRef}
                              renderContent=${c.renderContent}
                              handleContentInput=${p.handleContentInput}
                              handleEditorKeyDown=${p.handleEditorKeyDown}
                              handleEditorScroll=${p.handleEditorScroll}
                              handleEditorSelectionChange=${p.handleEditorSelectionChange}
                              isEditBlocked=${d.isEditBlocked}
                              isPreviewOnly=${c.isPreviewOnly}
                            />
                          `:dn`
                            <${Yo}
                              editorLineNumbers=${d.editorLineNumbers}
                              editorLineNumbersRef=${u.editorLineNumbersRef}
                              editorLineNumberRowRefs=${u.editorLineNumberRowRefs}
                              shouldUseHighlightedEditor=${d.shouldUseHighlightedEditor}
                              highlightedEditorLines=${d.highlightedEditorLines}
                              editorHighlightRef=${u.editorHighlightRef}
                              editorHighlightLineRefs=${u.editorHighlightLineRefs}
                              editorTextareaRef=${u.editorTextareaRef}
                              renderContent=${c.renderContent}
                              handleContentInput=${p.handleContentInput}
                              handleEditorKeyDown=${p.handleEditorKeyDown}
                              handleEditorScroll=${p.handleEditorScroll}
                              handleEditorSelectionChange=${p.handleEditorSelectionChange}
                              isEditBlocked=${d.isEditBlocked}
                              isPreviewOnly=${c.isPreviewOnly}
                            />
                          `}
                    `}
      <${st}
        visible=${a}
        title="Delete file?"
        message=${`Delete ${f.normalizedPath||"this file"}? This can be restored from diff view before sync.`}
        confirmLabel="Delete"
        confirmLoadingLabel="Deleting..."
        cancelLabel="Cancel"
        confirmTone="warning"
        confirmLoading=${c.deleting}
        confirmDisabled=${!d.canDeleteFile||c.deleting}
        onCancel=${()=>{c.deleting||l(!1)}}
        onConfirm=${async()=>{await p.handleDelete(),l(!1)}}
      />
    </div>
  `};var z2=P.bind(T),uu=({activeBrowsePath:t="",browseView:e="edit",lineTarget:n=0,lineEndTarget:s=0,selectedBrowsePath:o="",onNavigateToBrowseFile:r=()=>{},onEditSelectedBrowseFile:i=()=>{},onClearSelection:a=()=>{}})=>z2`
  <div class="w-full">
    <${Wy}
      filePath=${t}
      isPreviewOnly=${!1}
      browseView=${e}
      lineTarget=${n}
      lineEndTarget=${s}
      onRequestEdit=${l=>{let c=String(l||"");if(c&&c!==o){r(c,{view:"edit"});return}i()}}
      onRequestClearSelection=${a}
    />
  </div>
`;var ws="__all__",U2={0:"Sun",1:"Mon",2:"Tue",3:"Wed",4:"Thu",5:"Fri",6:"Sat",7:"Sun"},K2=({hourField:t,minuteField:e})=>{let n=Number.parseInt(String(t||""),10),s=Number.parseInt(String(e||""),10);if(!Number.isFinite(n)||!Number.isFinite(s))return"";let o=(n%24+24)%24,r=o>=12?"pm":"am",i=o%12===0?12:o%12,a=String(s).padStart(2,"0");return`${i}:${a}${r}`},Vy=t=>{let e=Number.parseInt(String(t||""),10);if(!Number.isFinite(e))return"";let n=(e%24+24)%24,s=n>=12?"pm":"am";return`${n%12===0?12:n%12}${s}`},G2=(t="")=>{let e=String(t||"").match(/^(\d{1,2})-(\d{1,2})$/);if(!e)return"";let n=Vy(e[1]),s=Vy(e[2]);return!n||!s?"":`${n}-${s}`},jy=(t="")=>{let e=String(t||"").trim().split(/\s+/);if(e.length<5)return"";let[n,s,o,r,i]=e;if(o==="*"&&r==="*"&&i==="*"&&s==="*"&&/^\*\/\d+$/.test(n))return`Every ${n.slice(2)}m`;if(o==="*"&&r==="*"&&i==="*"&&n==="0"&&/^\*\/\d+$/.test(s))return`Every ${s.slice(2)}h`;let a=K2({hourField:s,minuteField:n});if(o==="*"&&r==="*"&&i==="1-5"&&/^\*\/\d+$/.test(n)&&/^\d{1,2}-\d{1,2}$/.test(s)){let l=n.slice(2),c=G2(s);if(c)return`Every ${l}m, ${c} weekdays`}if(o==="*"&&r==="*"&&i==="1-5"&&a)return`Weekdays at ${a}`;if(o==="*"&&r==="*"&&/^([0-7])(,[0-7])*$/.test(i)&&a)return`Every ${i.split(",").map(c=>U2[c]||c).join(", ")} at ${a}`;if(o==="*"&&r==="*"&&i==="*"&&a)return`Daily at ${a}`;if(/^\d{1,2}$/.test(o)&&r==="*"&&i==="*"&&a){let l=Number.parseInt(o,10);if(Number.isFinite(l)&&l>=1&&l<=31)return`Monthly on day ${l} at ${a}`}return""},zy=(t="")=>String(t||"").trim().toLowerCase(),q2=()=>{try{return Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone||""}catch{return""}},Uy=({scheduleTimeZone:t="",includeTimeZone:e=!1,includeTimeZoneWhenDifferent:n=!1,clientTimeZone:s=""})=>{let o=zy(t);if(!o)return!1;if(e)return!0;if(!n)return!1;let r=zy(s||q2());return r?r!==o:!0},Qo=(t={},{includeTimeZone:e=!1,includeTimeZoneWhenDifferent:n=!1,clientTimeZone:s=""}={})=>{let o=String(t?.kind||"").trim();if(o==="every"){let i=Number(t?.everyMs||0);return i>0?`Every ${bn(i)}`:"Every interval"}if(o==="at")return`At ${Yn(t?.at,{fallback:"scheduled time"})}`;if(o==="cron"){let i=String(t?.expr||"").trim();if(!i)return"Cron";let a=jy(i),l=String(t?.tz||"").trim(),c=Uy({scheduleTimeZone:l,includeTimeZone:e,includeTimeZoneWhenDifferent:n,clientTimeZone:s});return a?c?`${a} (${l})`:a:c?`${i} (${l})`:i}let r=String(t?.expr||t?.cron||t?.cronExpr||"").trim();if(r){let i=jy(r),a=String(t?.tz||t?.timezone||"").trim(),l=Uy({scheduleTimeZone:a,includeTimeZone:e,includeTimeZoneWhenDifferent:n,clientTimeZone:s});return i?l?`${i} (${a})`:i:l?`${r} (${a})`:r}return"Unknown schedule"},J2=(t,e=Date.now())=>{let n=Number(t||0);if(!Number.isFinite(n)||n<=0)return"\u2014";let s=n-e,o=s>0,r=Math.round(Math.abs(s)/1e3);if(r<60)return o?"in <1m":"just now";let i=Math.round(r/60);if(i<60)return o?`in ${i}m`:`${i}m ago`;let a=Math.round(i/60);if(a<24)return o?`in ${a}h`:`${a}h ago`;let l=Math.round(a/24);return o?`in ${l}d`:`${l}d ago`},Ky=(t,e=Date.now())=>{let n=Number(t||0);if(!Number.isFinite(n)||n<=0)return"\u2014";let s=Math.abs(n-e),o=Math.max(0,Math.round(s/1e3));if(o<60)return`${o}s`;let r=Math.round(o/60);if(r<60)return`${r}m`;let i=Math.round(r/60);if(i<24)return`${i}h`;let a=Math.round(i/24);return a<30?`${a}d`:`${Math.round(a/30)}mo`},Gy=(t,e=Date.now())=>{let n=Number(t||0);if(!Number.isFinite(n)||n<=0)return"\u2014";if(n>=e)return J2(n,e);let s=e-n;if(s<60*1e3)return"due now";let o=Math.round(s/1e3);if(o<60)return"overdue by <1m";let r=Math.round(o/60);if(r<60)return`overdue by ${r}m`;let i=Math.round(r/60);return i<24?`overdue by ${i}h`:`overdue by ${Math.round(i/24)}d`},qy=(t={})=>{if(t.enabled===!1)return"disabled";if(t?.state?.runningAtMs)return"running";let e=String(t?.state?.lastStatus||t?.state?.lastRunStatus||"").trim().toLowerCase();return e==="error"?"error":e==="ok"?"ok":"unknown"},Jy=(t="")=>t==="ok"?"bg-green-500":t==="error"?"bg-red-500":t==="running"?"bg-yellow-400":"bg-gray-500",Te=t=>Jt(Number(t||0)),it=t=>gn(Number(t||0)),rn=(t={})=>{let e=t?.usage||{},s=[e?.input_tokens,e?.inputTokens,e?.output_tokens,e?.outputTokens,e?.cache_read_tokens,e?.cacheReadTokens,e?.cache_write_tokens,e?.cacheWriteTokens].reduce((r,i)=>{let a=Number(i);return!Number.isFinite(a)||a<0?r:r+a},0);if(s>0)return s;let o=[e?.total_tokens,e?.totalTokens,t?.total_tokens,t?.totalTokens];for(let r of o){let i=Number(r);if(Number.isFinite(i)&&i>=0)return i}return 0},$n=(t={})=>{let e=t?.usage||{},n=[t?.estimatedCost,t?.estimated_cost,e?.estimatedCost,e?.estimated_cost,e?.totalCost,e?.total_cost,e?.costUsd,e?.cost];for(let s of n){let o=Number(s);if(Number.isFinite(o)&&o>=0)return o}return null},Z2=(t={})=>{let e=t?.state||{};try{return String(JSON.stringify(e)||"").toUpperCase().includes("HEARTBEAT_OK")}catch{return!1}},Y2=({jobId:t="",bulkRunsByJobId:e={}}={})=>{let n=String(t||"").trim();if(!n)return!1;let s=Array.isArray(e?.[n]?.entries)?e[n].entries:[];if(s.length===0)return!1;let o=s.reduce((i,a)=>Number(a?.ts||0)>Number(i?.ts||0)?a:i);return[o?.summary,o?.result?.summary,o?.payload?.summary].some(i=>String(i||"").toUpperCase().includes("HEARTBEAT_OK"))},X2=({job:t={},jobId:e="",bulkRunsByJobId:n={}}={})=>{let s=String(e||"").trim(),o=Array.isArray(n?.[s]?.entries)?n[s].entries:[],r=o.length>0?o.reduce((a,l)=>Number(l?.ts||0)>Number(a?.ts||0)?l:a):null;return String(r?.status||t?.state?.lastStatus||t?.state?.lastRunStatus||"").trim().toLowerCase()},Zy=(t=[],e={})=>{let n=[];return t.forEach(s=>{let o=String(s?.id||""),r=String(s?.payload?.message||"").toLowerCase();String(s?.delivery?.mode||"").toLowerCase()==="none"&&(r.includes("message tool")||r.includes("send to telegram"))&&n.push({tone:"warning",jobId:String(s?.id||""),title:`${s.name||s.id}: delivery mismatch`,body:"Job uses delivery.mode=none but prompt asks to send via message tool."}),Number(s?.state?.consecutiveErrors||0)>=2&&n.push({tone:"error",jobId:String(s?.id||""),title:`${s.name||s.id}: repeated errors`,body:`Consecutive errors: ${Number(s?.state?.consecutiveErrors||0)}.`});let a=X2({job:s,jobId:o,bulkRunsByJobId:e});s?.state?.lastDelivered===!1&&String(s?.state?.lastDeliveryStatus||"").trim().toLowerCase()==="not-delivered"&&a!=="ok"&&!Z2(s)&&!Y2({jobId:o,bulkRunsByJobId:e})&&n.push({tone:"warning",jobId:o,title:`${s.name||s.id}: not delivered`,body:"Latest run completed but was not delivered."})}),n.slice(0,8)},Yy=(t=[])=>t.filter(n=>n?.enabled!==!1).map(n=>Number(n?.state?.nextRunAtMs||0)).filter(n=>Number.isFinite(n)&&n>0).sort((n,s)=>n-s)[0]||null;var xl=P.bind(T),Q2=["daily","weekly","monthly","other"],e_={daily:"Daily",weekly:"Weekly",monthly:"Monthly",other:"Other"},t_=60,es=(t="")=>{let e=Number.parseInt(String(t||"").trim(),10);return Number.isFinite(e)?e:null},er=t=>{if(!Number.isFinite(t))return null;let e=t===7?0:t;return e>=0&&e<=6?e:null},n_=(t="")=>{let e=String(t||"").trim().toLowerCase();if(!e||e==="*")return null;let n=e.split(",").map(o=>o.trim()).filter(Boolean),s=[];return n.forEach(o=>{let r=o.match(/^(\d{1,2})-(\d{1,2})$/);if(r){let a=er(es(r[1])),l=er(es(r[2]));if(a==null||l==null)return;if(a<=l)for(let c=a;c<=l;c+=1)s.push(c);else{for(let c=a;c<=6;c+=1)s.push(c);for(let c=0;c<=l;c+=1)s.push(c)}return}let i=er(es(o));i!=null&&s.push(i)}),s.length===0?null:Math.min(...s)},s_=(t="")=>{let e=String(t||"").trim().toLowerCase();if(!e||e==="*")return[];let n=e.split(",").map(o=>o.trim()).filter(Boolean),s=new Set;return n.forEach(o=>{let r=o.match(/^(\d{1,2})-(\d{1,2})$/);if(r){let a=er(es(r[1])),l=er(es(r[2]));if(a==null||l==null)return;if(a<=l)for(let c=a;c<=l;c+=1)s.add(c);else{for(let c=a;c<=6;c+=1)s.add(c);for(let c=0;c<=l;c+=1)s.add(c)}return}let i=er(es(o));i!=null&&s.add(i)}),[...s].sort((o,r)=>o-r)},Qy=(t="")=>{let e=s_(t);return e.length!==5?!1:e.join(",")==="1,2,3,4,5"},o_=({minuteField:t="",hourField:e=""})=>{let n=es(t),s=es(e);return n==null||s==null||n<0||n>59||s<0||s>23?null:s*t_+n},r_=(t={})=>{let n=String(t?.expr||t?.cron||t?.cronExpr||"").trim().split(/\s+/);if(n.length<5)return null;let[s,o,r,i,a]=n;return{minuteField:s,hourField:o,dayOfMonthField:r,monthField:i,dayOfWeekField:a}},Xy=(t={},e="other")=>{let n=t?.schedule||{},s=String(n?.kind||"").trim().toLowerCase(),o=r_(n),r=o?o_({minuteField:o.minuteField,hourField:o.hourField}):null,i=String(t?.name||t?.id||"").toLowerCase();if(e==="daily"){if(s==="every"){let a=Number(n?.everyMs||Number.MAX_SAFE_INTEGER);return{groupRank:0,primary:Number.isFinite(a)?a:Number.MAX_SAFE_INTEGER,secondary:i}}if(o&&o.dayOfMonthField==="*"&&o.monthField==="*"&&o.dayOfWeekField==="*"&&r!=null)return{groupRank:1,primary:r,secondary:i};if(o&&o.dayOfMonthField==="*"&&o.monthField==="*"&&Qy(o.dayOfWeekField)&&r!=null)return{groupRank:2,primary:r,secondary:i}}if(e==="weekly"&&o){let a=n_(o.dayOfWeekField);return{groupRank:0,primary:a??Number.MAX_SAFE_INTEGER,secondary:r??Number.MAX_SAFE_INTEGER,tertiary:i}}if(e==="monthly"&&o){let a=es(o.dayOfMonthField);return{groupRank:0,primary:a??Number.MAX_SAFE_INTEGER,secondary:r??Number.MAX_SAFE_INTEGER,tertiary:i}}return{groupRank:99,primary:Number.MAX_SAFE_INTEGER,secondary:Number.MAX_SAFE_INTEGER,tertiary:i}},yl=(t,e)=>t===e?0:t>e?1:-1,vl=(t=[],e="other")=>[...t].sort((n,s)=>{let o=Xy(n,e),r=Xy(s,e),i=yl(o.groupRank,r.groupRank);if(i!==0)return i;let a=yl(o.primary,r.primary);if(a!==0)return a;let l=yl(o.secondary,r.secondary);return l!==0?l:yl(o.tertiary,r.tertiary)}),i_=(t={})=>{if(String(t?.kind||"").trim().toLowerCase()==="every"){let o=Number(t?.everyMs||0);if(Number.isFinite(o)&&o>0){if(o<=1440*60*1e3)return"daily";if(o<=10080*60*1e3)return"weekly";if(o<=744*60*60*1e3)return"monthly"}return"other"}let s=String(t?.expr||t?.cron||t?.cronExpr||"").trim().split(/\s+/);if(s.length>=5){let[,,o,r,i]=s;if(o==="*"&&r==="*"&&i==="*")return"daily";if(o==="*"&&r==="*"&&i!=="*")return Qy(i)?"daily":"weekly";if(o!=="*"&&r==="*")return"monthly"}return"other"},ev=({jobs:t=[],selectedRouteKey:e=ws,onSelectAllJobs:n=()=>{},onSelectJob:s=()=>{}})=>{let o=ee(null),[r,i]=y("");L(()=>{let d=window.requestAnimationFrame(()=>{o.current?.focus()});return()=>{window.cancelAnimationFrame(d)}},[]);let a=String(r||"").trim().toLowerCase(),l=F(()=>a?t.filter(d=>{let u=String(d?.name||"").toLowerCase(),p=String(d?.id||"").toLowerCase();return u.includes(a)||p.includes(a)}):t,[t,a]),c=F(()=>{let d={daily:[],weekly:[],monthly:[],other:[]};return l.forEach(u=>{let p=i_(u?.schedule);d[p]?d[p].push(u):d.other.push(u)}),{daily:vl(d.daily,"daily"),weekly:vl(d.weekly,"weekly"),monthly:vl(d.monthly,"monthly"),other:vl(d.other,"other")}},[l]);return xl`
    <div class="cron-list-panel-inner">
      <div class="cron-list-sticky-search">
        <input
          ref=${o}
          type="text"
          value=${r}
          placeholder="Search cron jobs..."
          class="cron-list-search-input"
          onInput=${d=>i(d.target.value)}
        />
      </div>
      <button
        type="button"
        class=${`cron-list-item cron-list-all ${e===ws?"is-selected":""}`}
        onclick=${n}
      >
        <span class="cron-list-item-title">All Jobs</span>
        <span class="cron-list-item-subtitle">${t.length} total</span>
      </button>

      <div class="cron-list-items">
        ${Q2.map(d=>{let u=c[d]||[];return u.length===0?null:xl`
            <div key=${d} class="cron-list-group">
              <div class="cron-list-group-header">${e_[d]||"Other"}</div>
              <div class="cron-list-group-items">
                ${u.map(p=>{let f=qy(p),g=e===String(p.id||"");return xl`
                    <button
                      key=${p.id}
                      type="button"
                      class=${`cron-list-item ${g?"is-selected":""}`}
                      onclick=${()=>s(p.id)}
                    >
                      <span class="cron-list-item-row">
                        <span class="cron-list-item-title truncate">${p.name||p.id}</span>
                        <span class="cron-list-status-inline">
                          <span class="cron-list-last-run">
                            ${Ky(p?.state?.lastRunAtMs)}
                          </span>
                          <span
                            class=${`cron-list-health-dot ${Jy(f)}`}
                            title=${f}
                          ></span>
                        </span>
                      </span>
                      <span class="cron-list-item-subtitle">
                        ${Qo(p.schedule,{includeTimeZoneWhenDifferent:!0})}
                      </span>
                    </button>
                  `})}
              </div>
            </div>
          `})}
      </div>
      ${l.length===0?xl`
            <div class="text-xs text-fg-muted px-1 py-2">No cron jobs match your search.</div>
          `:null}
    </div>
  `};var a_=P.bind(T),l_=[{label:"7d",value:7},{label:"30d",value:30}],c_=(t=null)=>{let e=Array.isArray(t?.modelBreakdown)?t.modelBreakdown:[];if(e.length===0)return"\u2014";let n=e[0],s=String(n?.model||"").trim(),o=String(n?.provider||"").trim();return!s&&!o?"\u2014":o?s?`${o} / ${s}`:o:s},tv=({usage:t=null,usageDays:e=30,onSetUsageDays:n=()=>{}})=>{let s=t?.totals||{},o=Number(s?.runCount||0),r=Number(s?.totalTokens||0),i=Number(s?.totalCost||0),a=Number(s?.avgDurationMs||0),l=o>0?Math.round(r/o):0,c=o>0?i/o:0;return a_`
    <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="card-label card-label-bright">Usage</h3>
        <${Xe}
          options=${l_}
          value=${e}
          onChange=${n}
        />
      </div>
      <div class="grid grid-cols-3 gap-2 text-xs">
        <div class="ac-surface-inset rounded-lg p-2">
          <div class="text-fg-muted">Total runs</div>
          <div class="text-body font-mono">${Te(o)}</div>
        </div>
        <div class="ac-surface-inset rounded-lg p-2">
          <div class="text-fg-muted">Total tokens</div>
          <div class="text-body font-mono">${Te(r)}</div>
        </div>
        <div class="ac-surface-inset rounded-lg p-2">
          <div class="text-fg-muted">Total cost</div>
          <div class="text-body font-mono">${it(i)}</div>
        </div>
        <div class="ac-surface-inset rounded-lg p-2">
          <div class="text-fg-muted">Avg run time</div>
          <div class="text-body font-mono">
            ${a>0?bn(a):"\u2014"}
          </div>
        </div>
        <div class="ac-surface-inset rounded-lg p-2">
          <div class="text-fg-muted">Avg tokens/run</div>
          <div class="text-body font-mono">${Te(l)}</div>
        </div>
        <div class="ac-surface-inset rounded-lg p-2">
          <div class="text-fg-muted">Avg cost/run</div>
          <div class="text-body font-mono">${it(c)}</div>
        </div>
      </div>
      <div class="text-xs text-fg-muted">
        Dominant model:${" "}
        <span class="text-body font-mono">${c_(t)}</span>
      </div>
    </section>
  `};function pi(t){return t+.5|0}var ks=(t,e,n)=>Math.max(Math.min(t,n),e);function di(t){return ks(pi(t*2.55),0,255)}function Ss(t){return ks(pi(t*255),0,255)}function ts(t){return ks(pi(t/2.55)/100,0,1)}function nv(t){return ks(pi(t*100),0,100)}var un={0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,A:10,B:11,C:12,D:13,E:14,F:15,a:10,b:11,c:12,d:13,e:14,f:15},fu=[..."0123456789ABCDEF"],d_=t=>fu[t&15],u_=t=>fu[(t&240)>>4]+fu[t&15],$l=t=>(t&240)>>4===(t&15),p_=t=>$l(t.r)&&$l(t.g)&&$l(t.b)&&$l(t.a);function f_(t){var e=t.length,n;return t[0]==="#"&&(e===4||e===5?n={r:255&un[t[1]]*17,g:255&un[t[2]]*17,b:255&un[t[3]]*17,a:e===5?un[t[4]]*17:255}:(e===7||e===9)&&(n={r:un[t[1]]<<4|un[t[2]],g:un[t[3]]<<4|un[t[4]],b:un[t[5]]<<4|un[t[6]],a:e===9?un[t[7]]<<4|un[t[8]]:255})),n}var h_=(t,e)=>t<255?e(t):"";function m_(t){var e=p_(t)?d_:u_;return t?"#"+e(t.r)+e(t.g)+e(t.b)+h_(t.a,e):void 0}var g_=/^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;function iv(t,e,n){let s=e*Math.min(n,1-n),o=(r,i=(r+t/30)%12)=>n-s*Math.max(Math.min(i-3,9-i,1),-1);return[o(0),o(8),o(4)]}function b_(t,e,n){let s=(o,r=(o+t/60)%6)=>n-n*e*Math.max(Math.min(r,4-r,1),0);return[s(5),s(3),s(1)]}function x_(t,e,n){let s=iv(t,1,.5),o;for(e+n>1&&(o=1/(e+n),e*=o,n*=o),o=0;o<3;o++)s[o]*=1-e-n,s[o]+=e;return s}function y_(t,e,n,s,o){return t===o?(e-n)/s+(e<n?6:0):e===o?(n-t)/s+2:(t-e)/s+4}function hu(t){let n=t.r/255,s=t.g/255,o=t.b/255,r=Math.max(n,s,o),i=Math.min(n,s,o),a=(r+i)/2,l,c,d;return r!==i&&(d=r-i,c=a>.5?d/(2-r-i):d/(r+i),l=y_(n,s,o,d,r),l=l*60+.5),[l|0,c||0,a]}function mu(t,e,n,s){return(Array.isArray(e)?t(e[0],e[1],e[2]):t(e,n,s)).map(Ss)}function gu(t,e,n){return mu(iv,t,e,n)}function v_(t,e,n){return mu(x_,t,e,n)}function $_(t,e,n){return mu(b_,t,e,n)}function av(t){return(t%360+360)%360}function w_(t){let e=g_.exec(t),n=255,s;if(!e)return;e[5]!==s&&(n=e[6]?di(+e[5]):Ss(+e[5]));let o=av(+e[2]),r=+e[3]/100,i=+e[4]/100;return e[1]==="hwb"?s=v_(o,r,i):e[1]==="hsv"?s=$_(o,r,i):s=gu(o,r,i),{r:s[0],g:s[1],b:s[2],a:n}}function k_(t,e){var n=hu(t);n[0]=av(n[0]+e),n=gu(n),t.r=n[0],t.g=n[1],t.b=n[2]}function S_(t){if(!t)return;let e=hu(t),n=e[0],s=nv(e[1]),o=nv(e[2]);return t.a<255?`hsla(${n}, ${s}%, ${o}%, ${ts(t.a)})`:`hsl(${n}, ${s}%, ${o}%)`}var sv={x:"dark",Z:"light",Y:"re",X:"blu",W:"gr",V:"medium",U:"slate",A:"ee",T:"ol",S:"or",B:"ra",C:"lateg",D:"ights",R:"in",Q:"turquois",E:"hi",P:"ro",O:"al",N:"le",M:"de",L:"yello",F:"en",K:"ch",G:"arks",H:"ea",I:"ightg",J:"wh"},ov={OiceXe:"f0f8ff",antiquewEte:"faebd7",aqua:"ffff",aquamarRe:"7fffd4",azuY:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"0",blanKedOmond:"ffebcd",Xe:"ff",XeviTet:"8a2be2",bPwn:"a52a2a",burlywood:"deb887",caMtXe:"5f9ea0",KartYuse:"7fff00",KocTate:"d2691e",cSO:"ff7f50",cSnflowerXe:"6495ed",cSnsilk:"fff8dc",crimson:"dc143c",cyan:"ffff",xXe:"8b",xcyan:"8b8b",xgTMnPd:"b8860b",xWay:"a9a9a9",xgYF:"6400",xgYy:"a9a9a9",xkhaki:"bdb76b",xmagFta:"8b008b",xTivegYF:"556b2f",xSange:"ff8c00",xScEd:"9932cc",xYd:"8b0000",xsOmon:"e9967a",xsHgYF:"8fbc8f",xUXe:"483d8b",xUWay:"2f4f4f",xUgYy:"2f4f4f",xQe:"ced1",xviTet:"9400d3",dAppRk:"ff1493",dApskyXe:"bfff",dimWay:"696969",dimgYy:"696969",dodgerXe:"1e90ff",fiYbrick:"b22222",flSOwEte:"fffaf0",foYstWAn:"228b22",fuKsia:"ff00ff",gaRsbSo:"dcdcdc",ghostwEte:"f8f8ff",gTd:"ffd700",gTMnPd:"daa520",Way:"808080",gYF:"8000",gYFLw:"adff2f",gYy:"808080",honeyMw:"f0fff0",hotpRk:"ff69b4",RdianYd:"cd5c5c",Rdigo:"4b0082",ivSy:"fffff0",khaki:"f0e68c",lavFMr:"e6e6fa",lavFMrXsh:"fff0f5",lawngYF:"7cfc00",NmoncEffon:"fffacd",ZXe:"add8e6",ZcSO:"f08080",Zcyan:"e0ffff",ZgTMnPdLw:"fafad2",ZWay:"d3d3d3",ZgYF:"90ee90",ZgYy:"d3d3d3",ZpRk:"ffb6c1",ZsOmon:"ffa07a",ZsHgYF:"20b2aa",ZskyXe:"87cefa",ZUWay:"778899",ZUgYy:"778899",ZstAlXe:"b0c4de",ZLw:"ffffe0",lime:"ff00",limegYF:"32cd32",lRF:"faf0e6",magFta:"ff00ff",maPon:"800000",VaquamarRe:"66cdaa",VXe:"cd",VScEd:"ba55d3",VpurpN:"9370db",VsHgYF:"3cb371",VUXe:"7b68ee",VsprRggYF:"fa9a",VQe:"48d1cc",VviTetYd:"c71585",midnightXe:"191970",mRtcYam:"f5fffa",mistyPse:"ffe4e1",moccasR:"ffe4b5",navajowEte:"ffdead",navy:"80",Tdlace:"fdf5e6",Tive:"808000",TivedBb:"6b8e23",Sange:"ffa500",SangeYd:"ff4500",ScEd:"da70d6",pOegTMnPd:"eee8aa",pOegYF:"98fb98",pOeQe:"afeeee",pOeviTetYd:"db7093",papayawEp:"ffefd5",pHKpuff:"ffdab9",peru:"cd853f",pRk:"ffc0cb",plum:"dda0dd",powMrXe:"b0e0e6",purpN:"800080",YbeccapurpN:"663399",Yd:"ff0000",Psybrown:"bc8f8f",PyOXe:"4169e1",saddNbPwn:"8b4513",sOmon:"fa8072",sandybPwn:"f4a460",sHgYF:"2e8b57",sHshell:"fff5ee",siFna:"a0522d",silver:"c0c0c0",skyXe:"87ceeb",UXe:"6a5acd",UWay:"708090",UgYy:"708090",snow:"fffafa",sprRggYF:"ff7f",stAlXe:"4682b4",tan:"d2b48c",teO:"8080",tEstN:"d8bfd8",tomato:"ff6347",Qe:"40e0d0",viTet:"ee82ee",JHt:"f5deb3",wEte:"ffffff",wEtesmoke:"f5f5f5",Lw:"ffff00",LwgYF:"9acd32"};function C_(){let t={},e=Object.keys(ov),n=Object.keys(sv),s,o,r,i,a;for(s=0;s<e.length;s++){for(i=a=e[s],o=0;o<n.length;o++)r=n[o],a=a.replace(r,sv[r]);r=parseInt(ov[i],16),t[a]=[r>>16&255,r>>8&255,r&255]}return t}var wl;function __(t){wl||(wl=C_(),wl.transparent=[0,0,0,0]);let e=wl[t.toLowerCase()];return e&&{r:e[0],g:e[1],b:e[2],a:e.length===4?e[3]:255}}var M_=/^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;function A_(t){let e=M_.exec(t),n=255,s,o,r;if(e){if(e[7]!==s){let i=+e[7];n=e[8]?di(i):ks(i*255,0,255)}return s=+e[1],o=+e[3],r=+e[5],s=255&(e[2]?di(s):ks(s,0,255)),o=255&(e[4]?di(o):ks(o,0,255)),r=255&(e[6]?di(r):ks(r,0,255)),{r:s,g:o,b:r,a:n}}}function T_(t){return t&&(t.a<255?`rgba(${t.r}, ${t.g}, ${t.b}, ${ts(t.a)})`:`rgb(${t.r}, ${t.g}, ${t.b})`)}var pu=t=>t<=.0031308?t*12.92:Math.pow(t,1/2.4)*1.055-.055,tr=t=>t<=.04045?t/12.92:Math.pow((t+.055)/1.055,2.4);function P_(t,e,n){let s=tr(ts(t.r)),o=tr(ts(t.g)),r=tr(ts(t.b));return{r:Ss(pu(s+n*(tr(ts(e.r))-s))),g:Ss(pu(o+n*(tr(ts(e.g))-o))),b:Ss(pu(r+n*(tr(ts(e.b))-r))),a:t.a+n*(e.a-t.a)}}function kl(t,e,n){if(t){let s=hu(t);s[e]=Math.max(0,Math.min(s[e]+s[e]*n,e===0?360:1)),s=gu(s),t.r=s[0],t.g=s[1],t.b=s[2]}}function lv(t,e){return t&&Object.assign(e||{},t)}function rv(t){var e={r:0,g:0,b:0,a:255};return Array.isArray(t)?t.length>=3&&(e={r:t[0],g:t[1],b:t[2],a:255},t.length>3&&(e.a=Ss(t[3]))):(e=lv(t,{r:0,g:0,b:0,a:1}),e.a=Ss(e.a)),e}function R_(t){return t.charAt(0)==="r"?A_(t):w_(t)}var ui=class t{constructor(e){if(e instanceof t)return e;let n=typeof e,s;n==="object"?s=rv(e):n==="string"&&(s=f_(e)||__(e)||R_(e)),this._rgb=s,this._valid=!!s}get valid(){return this._valid}get rgb(){var e=lv(this._rgb);return e&&(e.a=ts(e.a)),e}set rgb(e){this._rgb=rv(e)}rgbString(){return this._valid?T_(this._rgb):void 0}hexString(){return this._valid?m_(this._rgb):void 0}hslString(){return this._valid?S_(this._rgb):void 0}mix(e,n){if(e){let s=this.rgb,o=e.rgb,r,i=n===r?.5:n,a=2*i-1,l=s.a-o.a,c=((a*l===-1?a:(a+l)/(1+a*l))+1)/2;r=1-c,s.r=255&c*s.r+r*o.r+.5,s.g=255&c*s.g+r*o.g+.5,s.b=255&c*s.b+r*o.b+.5,s.a=i*s.a+(1-i)*o.a,this.rgb=s}return this}interpolate(e,n){return e&&(this._rgb=P_(this._rgb,e._rgb,n)),this}clone(){return new t(this.rgb)}alpha(e){return this._rgb.a=Ss(e),this}clearer(e){let n=this._rgb;return n.a*=1-e,this}greyscale(){let e=this._rgb,n=pi(e.r*.3+e.g*.59+e.b*.11);return e.r=e.g=e.b=n,this}opaquer(e){let n=this._rgb;return n.a*=1+e,this}negate(){let e=this._rgb;return e.r=255-e.r,e.g=255-e.g,e.b=255-e.b,this}lighten(e){return kl(this._rgb,2,e),this}darken(e){return kl(this._rgb,2,-e),this}saturate(e){return kl(this._rgb,1,e),this}desaturate(e){return kl(this._rgb,1,-e),this}rotate(e){return k_(this._rgb,e),this}};function On(){}var yv=(()=>{let t=0;return()=>t++})();function _e(t){return t==null}function Ze(t){if(Array.isArray&&Array.isArray(t))return!0;let e=Object.prototype.toString.call(t);return e.slice(0,7)==="[object"&&e.slice(-6)==="Array]"}function Ae(t){return t!==null&&Object.prototype.toString.call(t)==="[object Object]"}function at(t){return(typeof t=="number"||t instanceof Number)&&isFinite(+t)}function Zt(t,e){return at(t)?t:e}function $e(t,e){return typeof t>"u"?e:t}var vv=(t,e)=>typeof t=="string"&&t.endsWith("%")?parseFloat(t)/100:+t/e,vu=(t,e)=>typeof t=="string"&&t.endsWith("%")?parseFloat(t)/100*e:+t;function qe(t,e,n){if(t&&typeof t.call=="function")return t.apply(n,e)}function ze(t,e,n,s){let o,r,i;if(Ze(t))if(r=t.length,s)for(o=r-1;o>=0;o--)e.call(n,t[o],o);else for(o=0;o<r;o++)e.call(n,t[o],o);else if(Ae(t))for(i=Object.keys(t),r=i.length,o=0;o<r;o++)e.call(n,t[i[o]],i[o])}function mi(t,e){let n,s,o,r;if(!t||!e||t.length!==e.length)return!1;for(n=0,s=t.length;n<s;++n)if(o=t[n],r=e[n],o.datasetIndex!==r.datasetIndex||o.index!==r.index)return!1;return!0}function Ml(t){if(Ze(t))return t.map(Ml);if(Ae(t)){let e=Object.create(null),n=Object.keys(t),s=n.length,o=0;for(;o<s;++o)e[n[o]]=Ml(t[n[o]]);return e}return t}function $v(t){return["__proto__","prototype","constructor"].indexOf(t)===-1}function L_(t,e,n,s){if(!$v(t))return;let o=e[t],r=n[t];Ae(o)&&Ae(r)?sr(o,r,s):e[t]=Ml(r)}function sr(t,e,n){let s=Ze(e)?e:[e],o=s.length;if(!Ae(t))return t;n=n||{};let r=n.merger||L_,i;for(let a=0;a<o;++a){if(i=s[a],!Ae(i))continue;let l=Object.keys(i);for(let c=0,d=l.length;c<d;++c)r(l[c],t,i,n)}return t}function rr(t,e){return sr(t,e,{merger:E_})}function E_(t,e,n){if(!$v(t))return;let s=e[t],o=n[t];Ae(s)&&Ae(o)?rr(s,o):Object.prototype.hasOwnProperty.call(e,t)||(e[t]=Ml(o))}var cv={"":t=>t,x:t=>t.x,y:t=>t.y};function I_(t){let e=t.split("."),n=[],s="";for(let o of e)s+=o,s.endsWith("\\")?s=s.slice(0,-1)+".":(n.push(s),s="");return n}function D_(t){let e=I_(t);return n=>{for(let s of e){if(s==="")break;n=n&&n[s]}return n}}function os(t,e){return(cv[e]||(cv[e]=D_(e)))(t)}function Rl(t){return t.charAt(0).toUpperCase()+t.slice(1)}var ir=t=>typeof t<"u",ns=t=>typeof t=="function",$u=(t,e)=>{if(t.size!==e.size)return!1;for(let n of t)if(!e.has(n))return!1;return!0};function wv(t){return t.type==="mouseup"||t.type==="click"||t.type==="contextmenu"}var Oe=Math.PI,Ye=2*Oe,N_=Ye+Oe,Al=Number.POSITIVE_INFINITY,O_=Oe/180,dt=Oe/2,so=Oe/4,dv=Oe*2/3,ss=Math.log10,wn=Math.sign;function ar(t,e,n){return Math.abs(t-e)<n}function wu(t){let e=Math.round(t);t=ar(t,e,t/1e3)?e:t;let n=Math.pow(10,Math.floor(ss(t))),s=t/n;return(s<=1?1:s<=2?2:s<=5?5:10)*n}function kv(t){let e=[],n=Math.sqrt(t),s;for(s=1;s<n;s++)t%s===0&&(e.push(s),e.push(t/s));return n===(n|0)&&e.push(n),e.sort((o,r)=>o-r).pop(),e}function B_(t){return typeof t=="symbol"||typeof t=="object"&&t!==null&&!(Symbol.toPrimitive in t||"toString"in t||"valueOf"in t)}function io(t){return!B_(t)&&!isNaN(parseFloat(t))&&isFinite(t)}function Sv(t,e){let n=Math.round(t);return n-e<=t&&n+e>=t}function ku(t,e,n){let s,o,r;for(s=0,o=t.length;s<o;s++)r=t[s][n],isNaN(r)||(e.min=Math.min(e.min,r),e.max=Math.max(e.max,r))}function pn(t){return t*(Oe/180)}function Ll(t){return t*(180/Oe)}function Su(t){if(!at(t))return;let e=1,n=0;for(;Math.round(t*e)/e!==t;)e*=10,n++;return n}function Cu(t,e){let n=e.x-t.x,s=e.y-t.y,o=Math.sqrt(n*n+s*s),r=Math.atan2(s,n);return r<-.5*Oe&&(r+=Ye),{angle:r,distance:o}}function Tl(t,e){return Math.sqrt(Math.pow(e.x-t.x,2)+Math.pow(e.y-t.y,2))}function F_(t,e){return(t-e+N_)%Ye-Oe}function Et(t){return(t%Ye+Ye)%Ye}function lr(t,e,n,s){let o=Et(t),r=Et(e),i=Et(n),a=Et(r-o),l=Et(i-o),c=Et(o-r),d=Et(o-i);return o===r||o===i||s&&r===i||a>l&&c<d}function vt(t,e,n){return Math.max(e,Math.min(n,t))}function Cv(t){return vt(t,-32768,32767)}function Bn(t,e,n,s=1e-6){return t>=Math.min(e,n)-s&&t<=Math.max(e,n)+s}function El(t,e,n){n=n||(i=>t[i]<e);let s=t.length-1,o=0,r;for(;s-o>1;)r=o+s>>1,n(r)?o=r:s=r;return{lo:o,hi:s}}var Dn=(t,e,n,s)=>El(t,n,s?o=>{let r=t[o][e];return r<n||r===n&&t[o+1][e]===n}:o=>t[o][e]<n),_v=(t,e,n)=>El(t,n,s=>t[s][e]>=n);function Mv(t,e,n){let s=0,o=t.length;for(;s<o&&t[s]<e;)s++;for(;o>s&&t[o-1]>n;)o--;return s>0||o<t.length?t.slice(s,o):t}var Av=["push","pop","shift","splice","unshift"];function Tv(t,e){if(t._chartjs){t._chartjs.listeners.push(e);return}Object.defineProperty(t,"_chartjs",{configurable:!0,enumerable:!1,value:{listeners:[e]}}),Av.forEach(n=>{let s="_onData"+Rl(n),o=t[n];Object.defineProperty(t,n,{configurable:!0,enumerable:!1,value(...r){let i=o.apply(this,r);return t._chartjs.listeners.forEach(a=>{typeof a[s]=="function"&&a[s](...r)}),i}})})}function _u(t,e){let n=t._chartjs;if(!n)return;let s=n.listeners,o=s.indexOf(e);o!==-1&&s.splice(o,1),!(s.length>0)&&(Av.forEach(r=>{delete t[r]}),delete t._chartjs)}function Mu(t){let e=new Set(t);return e.size===t.length?t:Array.from(e)}var Au=(function(){return typeof window>"u"?function(t){return t()}:window.requestAnimationFrame})();function Tu(t,e){let n=[],s=!1;return function(...o){n=o,s||(s=!0,Au.call(window,()=>{s=!1,t.apply(e,n)}))}}function Pv(t,e){let n;return function(...s){return e?(clearTimeout(n),n=setTimeout(t,e,s)):t.apply(this,s),e}}var Il=t=>t==="start"?"left":t==="end"?"right":"center",It=(t,e,n)=>t==="start"?e:t==="end"?n:(e+n)/2,Rv=(t,e,n,s)=>t===(s?"left":"right")?n:t==="center"?(e+n)/2:e;function Pu(t,e,n){let s=e.length,o=0,r=s;if(t._sorted){let{iScale:i,vScale:a,_parsed:l}=t,c=t.dataset&&t.dataset.options?t.dataset.options.spanGaps:null,d=i.axis,{min:u,max:p,minDefined:f,maxDefined:g}=i.getUserBounds();if(f){if(o=Math.min(Dn(l,d,u).lo,n?s:Dn(e,d,i.getPixelForValue(u)).lo),c){let m=l.slice(0,o+1).reverse().findIndex(h=>!_e(h[a.axis]));o-=Math.max(0,m)}o=vt(o,0,s-1)}if(g){let m=Math.max(Dn(l,i.axis,p,!0).hi+1,n?0:Dn(e,d,i.getPixelForValue(p),!0).hi+1);if(c){let h=l.slice(m-1).findIndex(b=>!_e(b[a.axis]));m+=Math.max(0,h)}r=vt(m,o,s)-o}else r=s-o}return{start:o,count:r}}function Ru(t){let{xScale:e,yScale:n,_scaleRanges:s}=t,o={xmin:e.min,xmax:e.max,ymin:n.min,ymax:n.max};if(!s)return t._scaleRanges=o,!0;let r=s.xmin!==e.min||s.xmax!==e.max||s.ymin!==n.min||s.ymax!==n.max;return Object.assign(s,o),r}var Sl=t=>t===0||t===1,uv=(t,e,n)=>-(Math.pow(2,10*(t-=1))*Math.sin((t-e)*Ye/n)),pv=(t,e,n)=>Math.pow(2,-10*t)*Math.sin((t-e)*Ye/n)+1,nr={linear:t=>t,easeInQuad:t=>t*t,easeOutQuad:t=>-t*(t-2),easeInOutQuad:t=>(t/=.5)<1?.5*t*t:-.5*(--t*(t-2)-1),easeInCubic:t=>t*t*t,easeOutCubic:t=>(t-=1)*t*t+1,easeInOutCubic:t=>(t/=.5)<1?.5*t*t*t:.5*((t-=2)*t*t+2),easeInQuart:t=>t*t*t*t,easeOutQuart:t=>-((t-=1)*t*t*t-1),easeInOutQuart:t=>(t/=.5)<1?.5*t*t*t*t:-.5*((t-=2)*t*t*t-2),easeInQuint:t=>t*t*t*t*t,easeOutQuint:t=>(t-=1)*t*t*t*t+1,easeInOutQuint:t=>(t/=.5)<1?.5*t*t*t*t*t:.5*((t-=2)*t*t*t*t+2),easeInSine:t=>-Math.cos(t*dt)+1,easeOutSine:t=>Math.sin(t*dt),easeInOutSine:t=>-.5*(Math.cos(Oe*t)-1),easeInExpo:t=>t===0?0:Math.pow(2,10*(t-1)),easeOutExpo:t=>t===1?1:-Math.pow(2,-10*t)+1,easeInOutExpo:t=>Sl(t)?t:t<.5?.5*Math.pow(2,10*(t*2-1)):.5*(-Math.pow(2,-10*(t*2-1))+2),easeInCirc:t=>t>=1?t:-(Math.sqrt(1-t*t)-1),easeOutCirc:t=>Math.sqrt(1-(t-=1)*t),easeInOutCirc:t=>(t/=.5)<1?-.5*(Math.sqrt(1-t*t)-1):.5*(Math.sqrt(1-(t-=2)*t)+1),easeInElastic:t=>Sl(t)?t:uv(t,.075,.3),easeOutElastic:t=>Sl(t)?t:pv(t,.075,.3),easeInOutElastic(t){return Sl(t)?t:t<.5?.5*uv(t*2,.1125,.45):.5+.5*pv(t*2-1,.1125,.45)},easeInBack(t){return t*t*((1.70158+1)*t-1.70158)},easeOutBack(t){return(t-=1)*t*((1.70158+1)*t+1.70158)+1},easeInOutBack(t){let e=1.70158;return(t/=.5)<1?.5*(t*t*(((e*=1.525)+1)*t-e)):.5*((t-=2)*t*(((e*=1.525)+1)*t+e)+2)},easeInBounce:t=>1-nr.easeOutBounce(1-t),easeOutBounce(t){return t<1/2.75?7.5625*t*t:t<2/2.75?7.5625*(t-=1.5/2.75)*t+.75:t<2.5/2.75?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375},easeInOutBounce:t=>t<.5?nr.easeInBounce(t*2)*.5:nr.easeOutBounce(t*2-1)*.5+.5};function Lu(t){if(t&&typeof t=="object"){let e=t.toString();return e==="[object CanvasPattern]"||e==="[object CanvasGradient]"}return!1}function Eu(t){return Lu(t)?t:new ui(t)}function bu(t){return Lu(t)?t:new ui(t).saturate(.5).darken(.1).hexString()}var H_=["x","y","borderWidth","radius","tension"],W_=["color","borderColor","backgroundColor"];function V_(t){t.set("animation",{delay:void 0,duration:1e3,easing:"easeOutQuart",fn:void 0,from:void 0,loop:void 0,to:void 0,type:void 0}),t.describe("animation",{_fallback:!1,_indexable:!1,_scriptable:e=>e!=="onProgress"&&e!=="onComplete"&&e!=="fn"}),t.set("animations",{colors:{type:"color",properties:W_},numbers:{type:"number",properties:H_}}),t.describe("animations",{_fallback:"animation"}),t.set("transitions",{active:{animation:{duration:400}},resize:{animation:{duration:0}},show:{animations:{colors:{from:"transparent"},visible:{type:"boolean",duration:0}}},hide:{animations:{colors:{to:"transparent"},visible:{type:"boolean",easing:"linear",fn:e=>e|0}}}})}function j_(t){t.set("layout",{autoPadding:!0,padding:{top:0,right:0,bottom:0,left:0}})}var fv=new Map;function z_(t,e){e=e||{};let n=t+JSON.stringify(e),s=fv.get(n);return s||(s=new Intl.NumberFormat(t,e),fv.set(n,s)),s}function cr(t,e,n){return z_(e,n).format(t)}var Lv={values(t){return Ze(t)?t:""+t},numeric(t,e,n){if(t===0)return"0";let s=this.chart.options.locale,o,r=t;if(n.length>1){let c=Math.max(Math.abs(n[0].value),Math.abs(n[n.length-1].value));(c<1e-4||c>1e15)&&(o="scientific"),r=U_(t,n)}let i=ss(Math.abs(r)),a=isNaN(i)?1:Math.max(Math.min(-1*Math.floor(i),20),0),l={notation:o,minimumFractionDigits:a,maximumFractionDigits:a};return Object.assign(l,this.options.ticks.format),cr(t,s,l)},logarithmic(t,e,n){if(t===0)return"0";let s=n[e].significand||t/Math.pow(10,Math.floor(ss(t)));return[1,2,3,5,10,15].includes(s)||e>.8*n.length?Lv.numeric.call(this,t,e,n):""}};function U_(t,e){let n=e.length>3?e[2].value-e[1].value:e[1].value-e[0].value;return Math.abs(n)>=1&&t!==Math.floor(t)&&(n=t-Math.floor(t)),n}var gi={formatters:Lv};function K_(t){t.set("scale",{display:!0,offset:!1,reverse:!1,beginAtZero:!1,bounds:"ticks",clip:!0,grace:0,grid:{display:!0,lineWidth:1,drawOnChartArea:!0,drawTicks:!0,tickLength:8,tickWidth:(e,n)=>n.lineWidth,tickColor:(e,n)=>n.color,offset:!1},border:{display:!0,dash:[],dashOffset:0,width:1},title:{display:!1,text:"",padding:{top:4,bottom:4}},ticks:{minRotation:0,maxRotation:50,mirror:!1,textStrokeWidth:0,textStrokeColor:"",padding:3,display:!0,autoSkip:!0,autoSkipPadding:3,labelOffset:0,callback:gi.formatters.values,minor:{},major:{},align:"center",crossAlign:"near",showLabelBackdrop:!1,backdropColor:"rgba(255, 255, 255, 0.75)",backdropPadding:2}}),t.route("scale.ticks","color","","color"),t.route("scale.grid","color","","borderColor"),t.route("scale.border","color","","borderColor"),t.route("scale.title","color","","color"),t.describe("scale",{_fallback:!1,_scriptable:e=>!e.startsWith("before")&&!e.startsWith("after")&&e!=="callback"&&e!=="parser",_indexable:e=>e!=="borderDash"&&e!=="tickBorderDash"&&e!=="dash"}),t.describe("scales",{_fallback:"scale"}),t.describe("scale.ticks",{_scriptable:e=>e!=="backdropPadding"&&e!=="callback",_indexable:e=>e!=="backdropPadding"})}var Ms=Object.create(null),Dl=Object.create(null);function fi(t,e){if(!e)return t;let n=e.split(".");for(let s=0,o=n.length;s<o;++s){let r=n[s];t=t[r]||(t[r]=Object.create(null))}return t}function xu(t,e,n){return typeof e=="string"?sr(fi(t,e),n):sr(fi(t,""),e)}var yu=class{constructor(e,n){this.animation=void 0,this.backgroundColor="rgba(0,0,0,0.1)",this.borderColor="rgba(0,0,0,0.1)",this.color="#666",this.datasets={},this.devicePixelRatio=s=>s.chart.platform.getDevicePixelRatio(),this.elements={},this.events=["mousemove","mouseout","click","touchstart","touchmove"],this.font={family:"'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",size:12,style:"normal",lineHeight:1.2,weight:null},this.hover={},this.hoverBackgroundColor=(s,o)=>bu(o.backgroundColor),this.hoverBorderColor=(s,o)=>bu(o.borderColor),this.hoverColor=(s,o)=>bu(o.color),this.indexAxis="x",this.interaction={mode:"nearest",intersect:!0,includeInvisible:!1},this.maintainAspectRatio=!0,this.onHover=null,this.onClick=null,this.parsing=!0,this.plugins={},this.responsive=!0,this.scale=void 0,this.scales={},this.showLine=!0,this.drawActiveElementsOnTop=!0,this.describe(e),this.apply(n)}set(e,n){return xu(this,e,n)}get(e){return fi(this,e)}describe(e,n){return xu(Dl,e,n)}override(e,n){return xu(Ms,e,n)}route(e,n,s,o){let r=fi(this,e),i=fi(this,s),a="_"+n;Object.defineProperties(r,{[a]:{value:r[n],writable:!0},[n]:{enumerable:!0,get(){let l=this[a],c=i[o];return Ae(l)?Object.assign({},c,l):$e(l,c)},set(l){this[a]=l}}})}apply(e){e.forEach(n=>n(this))}},Qe=new yu({_scriptable:t=>!t.startsWith("on"),_indexable:t=>t!=="events",hover:{_fallback:"interaction"},interaction:{_scriptable:!1,_indexable:!1}},[V_,j_,K_]);function G_(t){return!t||_e(t.size)||_e(t.family)?null:(t.style?t.style+" ":"")+(t.weight?t.weight+" ":"")+t.size+"px "+t.family}function hi(t,e,n,s,o){let r=e[o];return r||(r=e[o]=t.measureText(o).width,n.push(o)),r>s&&(s=r),s}function Ev(t,e,n,s){s=s||{};let o=s.data=s.data||{},r=s.garbageCollect=s.garbageCollect||[];s.font!==e&&(o=s.data={},r=s.garbageCollect=[],s.font=e),t.save(),t.font=e;let i=0,a=n.length,l,c,d,u,p;for(l=0;l<a;l++)if(u=n[l],u!=null&&!Ze(u))i=hi(t,o,r,i,u);else if(Ze(u))for(c=0,d=u.length;c<d;c++)p=u[c],p!=null&&!Ze(p)&&(i=hi(t,o,r,i,p));t.restore();let f=r.length/2;if(f>n.length){for(l=0;l<f;l++)delete o[r[l]];r.splice(0,f)}return i}function As(t,e,n){let s=t.currentDevicePixelRatio,o=n!==0?Math.max(n/2,.5):0;return Math.round((e-o)*s)/s+o}function Iu(t,e){!e&&!t||(e=e||t.getContext("2d"),e.save(),e.resetTransform(),e.clearRect(0,0,t.width,t.height),e.restore())}function Nl(t,e,n,s){Du(t,e,n,s,null)}function Du(t,e,n,s,o){let r,i,a,l,c,d,u,p,f=e.pointStyle,g=e.rotation,m=e.radius,h=(g||0)*O_;if(f&&typeof f=="object"&&(r=f.toString(),r==="[object HTMLImageElement]"||r==="[object HTMLCanvasElement]")){t.save(),t.translate(n,s),t.rotate(h),t.drawImage(f,-f.width/2,-f.height/2,f.width,f.height),t.restore();return}if(!(isNaN(m)||m<=0)){switch(t.beginPath(),f){default:o?t.ellipse(n,s,o/2,m,0,0,Ye):t.arc(n,s,m,0,Ye),t.closePath();break;case"triangle":d=o?o/2:m,t.moveTo(n+Math.sin(h)*d,s-Math.cos(h)*m),h+=dv,t.lineTo(n+Math.sin(h)*d,s-Math.cos(h)*m),h+=dv,t.lineTo(n+Math.sin(h)*d,s-Math.cos(h)*m),t.closePath();break;case"rectRounded":c=m*.516,l=m-c,i=Math.cos(h+so)*l,u=Math.cos(h+so)*(o?o/2-c:l),a=Math.sin(h+so)*l,p=Math.sin(h+so)*(o?o/2-c:l),t.arc(n-u,s-a,c,h-Oe,h-dt),t.arc(n+p,s-i,c,h-dt,h),t.arc(n+u,s+a,c,h,h+dt),t.arc(n-p,s+i,c,h+dt,h+Oe),t.closePath();break;case"rect":if(!g){l=Math.SQRT1_2*m,d=o?o/2:l,t.rect(n-d,s-l,2*d,2*l);break}h+=so;case"rectRot":u=Math.cos(h)*(o?o/2:m),i=Math.cos(h)*m,a=Math.sin(h)*m,p=Math.sin(h)*(o?o/2:m),t.moveTo(n-u,s-a),t.lineTo(n+p,s-i),t.lineTo(n+u,s+a),t.lineTo(n-p,s+i),t.closePath();break;case"crossRot":h+=so;case"cross":u=Math.cos(h)*(o?o/2:m),i=Math.cos(h)*m,a=Math.sin(h)*m,p=Math.sin(h)*(o?o/2:m),t.moveTo(n-u,s-a),t.lineTo(n+u,s+a),t.moveTo(n+p,s-i),t.lineTo(n-p,s+i);break;case"star":u=Math.cos(h)*(o?o/2:m),i=Math.cos(h)*m,a=Math.sin(h)*m,p=Math.sin(h)*(o?o/2:m),t.moveTo(n-u,s-a),t.lineTo(n+u,s+a),t.moveTo(n+p,s-i),t.lineTo(n-p,s+i),h+=so,u=Math.cos(h)*(o?o/2:m),i=Math.cos(h)*m,a=Math.sin(h)*m,p=Math.sin(h)*(o?o/2:m),t.moveTo(n-u,s-a),t.lineTo(n+u,s+a),t.moveTo(n+p,s-i),t.lineTo(n-p,s+i);break;case"line":i=o?o/2:Math.cos(h)*m,a=Math.sin(h)*m,t.moveTo(n-i,s-a),t.lineTo(n+i,s+a);break;case"dash":t.moveTo(n,s),t.lineTo(n+Math.cos(h)*(o?o/2:m),s+Math.sin(h)*m);break;case!1:t.closePath();break}t.fill(),e.borderWidth>0&&t.stroke()}}function Nn(t,e,n){return n=n||.5,!e||t&&t.x>e.left-n&&t.x<e.right+n&&t.y>e.top-n&&t.y<e.bottom+n}function bi(t,e){t.save(),t.beginPath(),t.rect(e.left,e.top,e.right-e.left,e.bottom-e.top),t.clip()}function xi(t){t.restore()}function Iv(t,e,n,s,o){if(!e)return t.lineTo(n.x,n.y);if(o==="middle"){let r=(e.x+n.x)/2;t.lineTo(r,e.y),t.lineTo(r,n.y)}else o==="after"!=!!s?t.lineTo(e.x,n.y):t.lineTo(n.x,e.y);t.lineTo(n.x,n.y)}function Dv(t,e,n,s){if(!e)return t.lineTo(n.x,n.y);t.bezierCurveTo(s?e.cp1x:e.cp2x,s?e.cp1y:e.cp2y,s?n.cp2x:n.cp1x,s?n.cp2y:n.cp1y,n.x,n.y)}function q_(t,e){e.translation&&t.translate(e.translation[0],e.translation[1]),_e(e.rotation)||t.rotate(e.rotation),e.color&&(t.fillStyle=e.color),e.textAlign&&(t.textAlign=e.textAlign),e.textBaseline&&(t.textBaseline=e.textBaseline)}function J_(t,e,n,s,o){if(o.strikethrough||o.underline){let r=t.measureText(s),i=e-r.actualBoundingBoxLeft,a=e+r.actualBoundingBoxRight,l=n-r.actualBoundingBoxAscent,c=n+r.actualBoundingBoxDescent,d=o.strikethrough?(l+c)/2:c;t.strokeStyle=t.fillStyle,t.beginPath(),t.lineWidth=o.decorationWidth||2,t.moveTo(i,d),t.lineTo(a,d),t.stroke()}}function Z_(t,e){let n=t.fillStyle;t.fillStyle=e.color,t.fillRect(e.left,e.top,e.width,e.height),t.fillStyle=n}function Ts(t,e,n,s,o,r={}){let i=Ze(e)?e:[e],a=r.strokeWidth>0&&r.strokeColor!=="",l,c;for(t.save(),t.font=o.string,q_(t,r),l=0;l<i.length;++l)c=i[l],r.backdrop&&Z_(t,r.backdrop),a&&(r.strokeColor&&(t.strokeStyle=r.strokeColor),_e(r.strokeWidth)||(t.lineWidth=r.strokeWidth),t.strokeText(c,n,s,r.maxWidth)),t.fillText(c,n,s,r.maxWidth),J_(t,n,s,c,r),s+=Number(o.lineHeight);t.restore()}function dr(t,e){let{x:n,y:s,w:o,h:r,radius:i}=e;t.arc(n+i.topLeft,s+i.topLeft,i.topLeft,1.5*Oe,Oe,!0),t.lineTo(n,s+r-i.bottomLeft),t.arc(n+i.bottomLeft,s+r-i.bottomLeft,i.bottomLeft,Oe,dt,!0),t.lineTo(n+o-i.bottomRight,s+r),t.arc(n+o-i.bottomRight,s+r-i.bottomRight,i.bottomRight,dt,0,!0),t.lineTo(n+o,s+i.topRight),t.arc(n+o-i.topRight,s+i.topRight,i.topRight,0,-dt,!0),t.lineTo(n+i.topLeft,s)}var Y_=/^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/,X_=/^(normal|italic|initial|inherit|unset|(oblique( -?[0-9]?[0-9]deg)?))$/;function Q_(t,e){let n=(""+t).match(Y_);if(!n||n[1]==="normal")return e*1.2;switch(t=+n[2],n[3]){case"px":return t;case"%":t/=100;break}return e*t}var e5=t=>+t||0;function Ol(t,e){let n={},s=Ae(e),o=s?Object.keys(e):e,r=Ae(t)?s?i=>$e(t[i],t[e[i]]):i=>t[i]:()=>t;for(let i of o)n[i]=e5(r(i));return n}function Nu(t){return Ol(t,{top:"y",right:"x",bottom:"y",left:"x"})}function Ps(t){return Ol(t,["topLeft","topRight","bottomLeft","bottomRight"])}function Dt(t){let e=Nu(t);return e.width=e.left+e.right,e.height=e.top+e.bottom,e}function ht(t,e){t=t||{},e=e||Qe.font;let n=$e(t.size,e.size);typeof n=="string"&&(n=parseInt(n,10));let s=$e(t.style,e.style);s&&!(""+s).match(X_)&&(console.warn('Invalid font style specified: "'+s+'"'),s=void 0);let o={family:$e(t.family,e.family),lineHeight:Q_($e(t.lineHeight,e.lineHeight),n),size:n,style:s,weight:$e(t.weight,e.weight),string:""};return o.string=G_(o),o}function ur(t,e,n,s){let o=!0,r,i,a;for(r=0,i=t.length;r<i;++r)if(a=t[r],a!==void 0&&(e!==void 0&&typeof a=="function"&&(a=a(e),o=!1),n!==void 0&&Ze(a)&&(a=a[n%a.length],o=!1),a!==void 0))return s&&!o&&(s.cacheable=!1),a}function Nv(t,e,n){let{min:s,max:o}=t,r=vu(e,(o-s)/2),i=(a,l)=>n&&a===0?0:a+l;return{min:i(s,-Math.abs(r)),max:i(o,r)}}function rs(t,e){return Object.assign(Object.create(t),e)}function Bl(t,e=[""],n,s,o=()=>t[0]){let r=n||t;typeof s>"u"&&(s=Fv("_fallback",t));let i={[Symbol.toStringTag]:"Object",_cacheable:!0,_scopes:t,_rootScopes:r,_fallback:s,_getTarget:o,override:a=>Bl([a,...t],e,r,s)};return new Proxy(i,{deleteProperty(a,l){return delete a[l],delete a._keys,delete t[0][l],!0},get(a,l){return Ov(a,l,()=>l5(l,e,t,a))},getOwnPropertyDescriptor(a,l){return Reflect.getOwnPropertyDescriptor(a._scopes[0],l)},getPrototypeOf(){return Reflect.getPrototypeOf(t[0])},has(a,l){return mv(a).includes(l)},ownKeys(a){return mv(a)},set(a,l,c){let d=a._storage||(a._storage=o());return a[l]=d[l]=c,delete a._keys,!0}})}function ro(t,e,n,s){let o={_cacheable:!1,_proxy:t,_context:e,_subProxy:n,_stack:new Set,_descriptors:Ou(t,s),setContext:r=>ro(t,r,n,s),override:r=>ro(t.override(r),e,n,s)};return new Proxy(o,{deleteProperty(r,i){return delete r[i],delete t[i],!0},get(r,i,a){return Ov(r,i,()=>n5(r,i,a))},getOwnPropertyDescriptor(r,i){return r._descriptors.allKeys?Reflect.has(t,i)?{enumerable:!0,configurable:!0}:void 0:Reflect.getOwnPropertyDescriptor(t,i)},getPrototypeOf(){return Reflect.getPrototypeOf(t)},has(r,i){return Reflect.has(t,i)},ownKeys(){return Reflect.ownKeys(t)},set(r,i,a){return t[i]=a,delete r[i],!0}})}function Ou(t,e={scriptable:!0,indexable:!0}){let{_scriptable:n=e.scriptable,_indexable:s=e.indexable,_allKeys:o=e.allKeys}=t;return{allKeys:o,scriptable:n,indexable:s,isScriptable:ns(n)?n:()=>n,isIndexable:ns(s)?s:()=>s}}var t5=(t,e)=>t?t+Rl(e):e,Bu=(t,e)=>Ae(e)&&t!=="adapters"&&(Object.getPrototypeOf(e)===null||e.constructor===Object);function Ov(t,e,n){if(Object.prototype.hasOwnProperty.call(t,e)||e==="constructor")return t[e];let s=n();return t[e]=s,s}function n5(t,e,n){let{_proxy:s,_context:o,_subProxy:r,_descriptors:i}=t,a=s[e];return ns(a)&&i.isScriptable(e)&&(a=s5(e,a,t,n)),Ze(a)&&a.length&&(a=o5(e,a,t,i.isIndexable)),Bu(e,a)&&(a=ro(a,o,r&&r[e],i)),a}function s5(t,e,n,s){let{_proxy:o,_context:r,_subProxy:i,_stack:a}=n;if(a.has(t))throw new Error("Recursion detected: "+Array.from(a).join("->")+"->"+t);a.add(t);let l=e(r,i||s);return a.delete(t),Bu(t,l)&&(l=Fu(o._scopes,o,t,l)),l}function o5(t,e,n,s){let{_proxy:o,_context:r,_subProxy:i,_descriptors:a}=n;if(typeof r.index<"u"&&s(t))return e[r.index%e.length];if(Ae(e[0])){let l=e,c=o._scopes.filter(d=>d!==l);e=[];for(let d of l){let u=Fu(c,o,t,d);e.push(ro(u,r,i&&i[t],a))}}return e}function Bv(t,e,n){return ns(t)?t(e,n):t}var r5=(t,e)=>t===!0?e:typeof t=="string"?os(e,t):void 0;function i5(t,e,n,s,o){for(let r of e){let i=r5(n,r);if(i){t.add(i);let a=Bv(i._fallback,n,o);if(typeof a<"u"&&a!==n&&a!==s)return a}else if(i===!1&&typeof s<"u"&&n!==s)return null}return!1}function Fu(t,e,n,s){let o=e._rootScopes,r=Bv(e._fallback,n,s),i=[...t,...o],a=new Set;a.add(s);let l=hv(a,i,n,r||n,s);return l===null||typeof r<"u"&&r!==n&&(l=hv(a,i,r,l,s),l===null)?!1:Bl(Array.from(a),[""],o,r,()=>a5(e,n,s))}function hv(t,e,n,s,o){for(;n;)n=i5(t,e,n,s,o);return n}function a5(t,e,n){let s=t._getTarget();e in s||(s[e]={});let o=s[e];return Ze(o)&&Ae(n)?n:o||{}}function l5(t,e,n,s){let o;for(let r of e)if(o=Fv(t5(r,t),n),typeof o<"u")return Bu(t,o)?Fu(n,s,t,o):o}function Fv(t,e){for(let n of e){if(!n)continue;let s=n[t];if(typeof s<"u")return s}}function mv(t){let e=t._keys;return e||(e=t._keys=c5(t._scopes)),e}function c5(t){let e=new Set;for(let n of t)for(let s of Object.keys(n).filter(o=>!o.startsWith("_")))e.add(s);return Array.from(e)}function Hu(t,e,n,s){let{iScale:o}=t,{key:r="r"}=this._parsing,i=new Array(s),a,l,c,d;for(a=0,l=s;a<l;++a)c=a+n,d=e[c],i[a]={r:o.parse(os(d,r),c)};return i}var d5=Number.EPSILON||1e-14,or=(t,e)=>e<t.length&&!t[e].skip&&t[e],Hv=t=>t==="x"?"y":"x";function u5(t,e,n,s){let o=t.skip?e:t,r=e,i=n.skip?e:n,a=Tl(r,o),l=Tl(i,r),c=a/(a+l),d=l/(a+l);c=isNaN(c)?0:c,d=isNaN(d)?0:d;let u=s*c,p=s*d;return{previous:{x:r.x-u*(i.x-o.x),y:r.y-u*(i.y-o.y)},next:{x:r.x+p*(i.x-o.x),y:r.y+p*(i.y-o.y)}}}function p5(t,e,n){let s=t.length,o,r,i,a,l,c=or(t,0);for(let d=0;d<s-1;++d)if(l=c,c=or(t,d+1),!(!l||!c)){if(ar(e[d],0,d5)){n[d]=n[d+1]=0;continue}o=n[d]/e[d],r=n[d+1]/e[d],a=Math.pow(o,2)+Math.pow(r,2),!(a<=9)&&(i=3/Math.sqrt(a),n[d]=o*i*e[d],n[d+1]=r*i*e[d])}}function f5(t,e,n="x"){let s=Hv(n),o=t.length,r,i,a,l=or(t,0);for(let c=0;c<o;++c){if(i=a,a=l,l=or(t,c+1),!a)continue;let d=a[n],u=a[s];i&&(r=(d-i[n])/3,a[`cp1${n}`]=d-r,a[`cp1${s}`]=u-r*e[c]),l&&(r=(l[n]-d)/3,a[`cp2${n}`]=d+r,a[`cp2${s}`]=u+r*e[c])}}function h5(t,e="x"){let n=Hv(e),s=t.length,o=Array(s).fill(0),r=Array(s),i,a,l,c=or(t,0);for(i=0;i<s;++i)if(a=l,l=c,c=or(t,i+1),!!l){if(c){let d=c[e]-l[e];o[i]=d!==0?(c[n]-l[n])/d:0}r[i]=a?c?wn(o[i-1])!==wn(o[i])?0:(o[i-1]+o[i])/2:o[i-1]:o[i]}p5(t,o,r),f5(t,r,e)}function Cl(t,e,n){return Math.max(Math.min(t,n),e)}function m5(t,e){let n,s,o,r,i,a=Nn(t[0],e);for(n=0,s=t.length;n<s;++n)i=r,r=a,a=n<s-1&&Nn(t[n+1],e),r&&(o=t[n],i&&(o.cp1x=Cl(o.cp1x,e.left,e.right),o.cp1y=Cl(o.cp1y,e.top,e.bottom)),a&&(o.cp2x=Cl(o.cp2x,e.left,e.right),o.cp2y=Cl(o.cp2y,e.top,e.bottom)))}function Wv(t,e,n,s,o){let r,i,a,l;if(e.spanGaps&&(t=t.filter(c=>!c.skip)),e.cubicInterpolationMode==="monotone")h5(t,o);else{let c=s?t[t.length-1]:t[0];for(r=0,i=t.length;r<i;++r)a=t[r],l=u5(c,a,t[Math.min(r+1,i-(s?0:1))%i],e.tension),a.cp1x=l.previous.x,a.cp1y=l.previous.y,a.cp2x=l.next.x,a.cp2y=l.next.y,c=a}e.capBezierPoints&&m5(t,n)}function Fl(){return typeof window<"u"&&typeof document<"u"}function Hl(t){let e=t.parentNode;return e&&e.toString()==="[object ShadowRoot]"&&(e=e.host),e}function Pl(t,e,n){let s;return typeof t=="string"?(s=parseInt(t,10),t.indexOf("%")!==-1&&(s=s/100*e.parentNode[n])):s=t,s}var Wl=t=>t.ownerDocument.defaultView.getComputedStyle(t,null);function g5(t,e){return Wl(t).getPropertyValue(e)}var b5=["top","right","bottom","left"];function oo(t,e,n){let s={};n=n?"-"+n:"";for(let o=0;o<4;o++){let r=b5[o];s[r]=parseFloat(t[e+"-"+r+n])||0}return s.width=s.left+s.right,s.height=s.top+s.bottom,s}var x5=(t,e,n)=>(t>0||e>0)&&(!n||!n.shadowRoot);function y5(t,e){let n=t.touches,s=n&&n.length?n[0]:t,{offsetX:o,offsetY:r}=s,i=!1,a,l;if(x5(o,r,t.target))a=o,l=r;else{let c=e.getBoundingClientRect();a=s.clientX-c.left,l=s.clientY-c.top,i=!0}return{x:a,y:l,box:i}}function Rs(t,e){if("native"in t)return t;let{canvas:n,currentDevicePixelRatio:s}=e,o=Wl(n),r=o.boxSizing==="border-box",i=oo(o,"padding"),a=oo(o,"border","width"),{x:l,y:c,box:d}=y5(t,n),u=i.left+(d&&a.left),p=i.top+(d&&a.top),{width:f,height:g}=e;return r&&(f-=i.width+a.width,g-=i.height+a.height),{x:Math.round((l-u)/f*n.width/s),y:Math.round((c-p)/g*n.height/s)}}function v5(t,e,n){let s,o;if(e===void 0||n===void 0){let r=t&&Hl(t);if(!r)e=t.clientWidth,n=t.clientHeight;else{let i=r.getBoundingClientRect(),a=Wl(r),l=oo(a,"border","width"),c=oo(a,"padding");e=i.width-c.width-l.width,n=i.height-c.height-l.height,s=Pl(a.maxWidth,r,"clientWidth"),o=Pl(a.maxHeight,r,"clientHeight")}}return{width:e,height:n,maxWidth:s||Al,maxHeight:o||Al}}var _s=t=>Math.round(t*10)/10;function Vv(t,e,n,s){let o=Wl(t),r=oo(o,"margin"),i=Pl(o.maxWidth,t,"clientWidth")||Al,a=Pl(o.maxHeight,t,"clientHeight")||Al,l=v5(t,e,n),{width:c,height:d}=l;if(o.boxSizing==="content-box"){let p=oo(o,"border","width"),f=oo(o,"padding");c-=f.width+p.width,d-=f.height+p.height}return c=Math.max(0,c-r.width),d=Math.max(0,s?c/s:d-r.height),c=_s(Math.min(c,i,l.maxWidth)),d=_s(Math.min(d,a,l.maxHeight)),c&&!d&&(d=_s(c/2)),(e!==void 0||n!==void 0)&&s&&l.height&&d>l.height&&(d=l.height,c=_s(Math.floor(d*s))),{width:c,height:d}}function Wu(t,e,n){let s=e||1,o=_s(t.height*s),r=_s(t.width*s);t.height=_s(t.height),t.width=_s(t.width);let i=t.canvas;return i.style&&(n||!i.style.height&&!i.style.width)&&(i.style.height=`${t.height}px`,i.style.width=`${t.width}px`),t.currentDevicePixelRatio!==s||i.height!==o||i.width!==r?(t.currentDevicePixelRatio=s,i.height=o,i.width=r,t.ctx.setTransform(s,0,0,s,0,0),!0):!1}var jv=(function(){let t=!1;try{let e={get passive(){return t=!0,!1}};Fl()&&(window.addEventListener("test",null,e),window.removeEventListener("test",null,e))}catch{}return t})();function Vu(t,e){let n=g5(t,e),s=n&&n.match(/^(\d+)(\.\d+)?px$/);return s?+s[1]:void 0}function Cs(t,e,n,s){return{x:t.x+n*(e.x-t.x),y:t.y+n*(e.y-t.y)}}function zv(t,e,n,s){return{x:t.x+n*(e.x-t.x),y:s==="middle"?n<.5?t.y:e.y:s==="after"?n<1?t.y:e.y:n>0?e.y:t.y}}function Uv(t,e,n,s){let o={x:t.cp2x,y:t.cp2y},r={x:e.cp1x,y:e.cp1y},i=Cs(t,o,n),a=Cs(o,r,n),l=Cs(r,e,n),c=Cs(i,a,n),d=Cs(a,l,n);return Cs(c,d,n)}var $5=function(t,e){return{x(n){return t+t+e-n},setWidth(n){e=n},textAlign(n){return n==="center"?n:n==="right"?"left":"right"},xPlus(n,s){return n-s},leftForLtr(n,s){return n-s}}},w5=function(){return{x(t){return t},setWidth(t){},textAlign(t){return t},xPlus(t,e){return t+e},leftForLtr(t,e){return t}}};function ao(t,e,n){return t?$5(e,n):w5()}function ju(t,e){let n,s;(e==="ltr"||e==="rtl")&&(n=t.canvas.style,s=[n.getPropertyValue("direction"),n.getPropertyPriority("direction")],n.setProperty("direction",e,"important"),t.prevTextDirection=s)}function zu(t,e){e!==void 0&&(delete t.prevTextDirection,t.canvas.style.setProperty("direction",e[0],e[1]))}function Kv(t){return t==="angle"?{between:lr,compare:F_,normalize:Et}:{between:Bn,compare:(e,n)=>e-n,normalize:e=>e}}function gv({start:t,end:e,count:n,loop:s,style:o}){return{start:t%n,end:e%n,loop:s&&(e-t+1)%n===0,style:o}}function k5(t,e,n){let{property:s,start:o,end:r}=n,{between:i,normalize:a}=Kv(s),l=e.length,{start:c,end:d,loop:u}=t,p,f;if(u){for(c+=l,d+=l,p=0,f=l;p<f&&i(a(e[c%l][s]),o,r);++p)c--,d--;c%=l,d%=l}return d<c&&(d+=l),{start:c,end:d,loop:u,style:t.style}}function Uu(t,e,n){if(!n)return[t];let{property:s,start:o,end:r}=n,i=e.length,{compare:a,between:l,normalize:c}=Kv(s),{start:d,end:u,loop:p,style:f}=k5(t,e,n),g=[],m=!1,h=null,b,x,v,w=()=>l(o,v,b)&&a(o,v)!==0,$=()=>a(r,b)===0||l(r,v,b),S=()=>m||w(),C=()=>!m||$();for(let _=d,k=d;_<=u;++_)x=e[_%i],!x.skip&&(b=c(x[s]),b!==v&&(m=l(b,o,r),h===null&&S()&&(h=a(b,o)===0?_:k),h!==null&&C()&&(g.push(gv({start:h,end:_,loop:p,count:i,style:f})),h=null),k=_,v=b));return h!==null&&g.push(gv({start:h,end:u,loop:p,count:i,style:f})),g}function Ku(t,e){let n=[],s=t.segments;for(let o=0;o<s.length;o++){let r=Uu(s[o],t.points,e);r.length&&n.push(...r)}return n}function S5(t,e,n,s){let o=0,r=e-1;if(n&&!s)for(;o<e&&!t[o].skip;)o++;for(;o<e&&t[o].skip;)o++;for(o%=e,n&&(r+=o);r>o&&t[r%e].skip;)r--;return r%=e,{start:o,end:r}}function C5(t,e,n,s){let o=t.length,r=[],i=e,a=t[e],l;for(l=e+1;l<=n;++l){let c=t[l%o];c.skip||c.stop?a.skip||(s=!1,r.push({start:e%o,end:(l-1)%o,loop:s}),e=i=c.stop?l:null):(i=l,a.skip&&(e=l)),a=c}return i!==null&&r.push({start:e%o,end:i%o,loop:s}),r}function Gv(t,e){let n=t.points,s=t.options.spanGaps,o=n.length;if(!o)return[];let r=!!t._loop,{start:i,end:a}=S5(n,o,r,s);if(s===!0)return bv(t,[{start:i,end:a,loop:r}],n,e);let l=a<i?a+o:a,c=!!t._fullLoop&&i===0&&a===o-1;return bv(t,C5(n,i,l,c),n,e)}function bv(t,e,n,s){return!s||!s.setContext||!n?e:_5(t,e,n,s)}function _5(t,e,n,s){let o=t._chart.getContext(),r=xv(t.options),{_datasetIndex:i,options:{spanGaps:a}}=t,l=n.length,c=[],d=r,u=e[0].start,p=u;function f(g,m,h,b){let x=a?-1:1;if(g!==m){for(g+=l;n[g%l].skip;)g-=x;for(;n[m%l].skip;)m+=x;g%l!==m%l&&(c.push({start:g%l,end:m%l,loop:h,style:b}),d=b,u=m%l)}}for(let g of e){u=a?u:g.start;let m=n[u%l],h;for(p=u+1;p<=g.end;p++){let b=n[p%l];h=xv(s.setContext(rs(o,{type:"segment",p0:m,p1:b,p0DataIndex:(p-1)%l,p1DataIndex:p%l,datasetIndex:i}))),M5(h,d)&&f(u,p-1,g.loop,d),m=b,d=h}u<p-1&&f(u,p-1,g.loop,d)}return c}function xv(t){return{backgroundColor:t.backgroundColor,borderCapStyle:t.borderCapStyle,borderDash:t.borderDash,borderDashOffset:t.borderDashOffset,borderJoinStyle:t.borderJoinStyle,borderWidth:t.borderWidth,borderColor:t.borderColor}}function M5(t,e){if(!e)return!1;let n=[],s=function(o,r){return Lu(r)?(n.includes(r)||n.push(r),n.indexOf(r)):r};return JSON.stringify(t,s)!==JSON.stringify(e,s)}function _l(t,e,n){return t.options.clip?t[n]:e[n]}function A5(t,e){let{xScale:n,yScale:s}=t;return n&&s?{left:_l(n,e,"left"),right:_l(n,e,"right"),top:_l(s,e,"top"),bottom:_l(s,e,"bottom")}:e}function Gu(t,e){let n=e._clip;if(n.disabled)return!1;let s=A5(e,t.chartArea);return{left:n.left===!1?0:s.left-(n.left===!0?0:n.left),right:n.right===!1?t.width:s.right+(n.right===!0?0:n.right),top:n.top===!1?0:s.top-(n.top===!0?0:n.top),bottom:n.bottom===!1?t.height:s.bottom+(n.bottom===!0?0:n.bottom)}}var rp=class{constructor(){this._request=null,this._charts=new Map,this._running=!1,this._lastDate=void 0}_notify(e,n,s,o){let r=n.listeners[o],i=n.duration;r.forEach(a=>a({chart:e,initial:n.initial,numSteps:i,currentStep:Math.min(s-n.start,i)}))}_refresh(){this._request||(this._running=!0,this._request=Au.call(window,()=>{this._update(),this._request=null,this._running&&this._refresh()}))}_update(e=Date.now()){let n=0;this._charts.forEach((s,o)=>{if(!s.running||!s.items.length)return;let r=s.items,i=r.length-1,a=!1,l;for(;i>=0;--i)l=r[i],l._active?(l._total>s.duration&&(s.duration=l._total),l.tick(e),a=!0):(r[i]=r[r.length-1],r.pop());a&&(o.draw(),this._notify(o,s,e,"progress")),r.length||(s.running=!1,this._notify(o,s,e,"complete"),s.initial=!1),n+=r.length}),this._lastDate=e,n===0&&(this._running=!1)}_getAnims(e){let n=this._charts,s=n.get(e);return s||(s={running:!1,initial:!0,items:[],listeners:{complete:[],progress:[]}},n.set(e,s)),s}listen(e,n,s){this._getAnims(e).listeners[n].push(s)}add(e,n){!n||!n.length||this._getAnims(e).items.push(...n)}has(e){return this._getAnims(e).items.length>0}start(e){let n=this._charts.get(e);n&&(n.running=!0,n.start=Date.now(),n.duration=n.items.reduce((s,o)=>Math.max(s,o._duration),0),this._refresh())}running(e){if(!this._running)return!1;let n=this._charts.get(e);return!(!n||!n.running||!n.items.length)}stop(e){let n=this._charts.get(e);if(!n||!n.items.length)return;let s=n.items,o=s.length-1;for(;o>=0;--o)s[o].cancel();n.items=[],this._notify(e,n,Date.now(),"complete")}remove(e){return this._charts.delete(e)}},is=new rp,qv="transparent",T5={boolean(t,e,n){return n>.5?e:t},color(t,e,n){let s=Eu(t||qv),o=s.valid&&Eu(e||qv);return o&&o.valid?o.mix(s,n).hexString():e},number(t,e,n){return t+(e-t)*n}},ip=class{constructor(e,n,s,o){let r=n[s];o=ur([e.to,o,r,e.from]);let i=ur([e.from,r,o]);this._active=!0,this._fn=e.fn||T5[e.type||typeof i],this._easing=nr[e.easing]||nr.linear,this._start=Math.floor(Date.now()+(e.delay||0)),this._duration=this._total=Math.floor(e.duration),this._loop=!!e.loop,this._target=n,this._prop=s,this._from=i,this._to=o,this._promises=void 0}active(){return this._active}update(e,n,s){if(this._active){this._notify(!1);let o=this._target[this._prop],r=s-this._start,i=this._duration-r;this._start=s,this._duration=Math.floor(Math.max(i,e.duration)),this._total+=r,this._loop=!!e.loop,this._to=ur([e.to,n,o,e.from]),this._from=ur([e.from,o,n])}}cancel(){this._active&&(this.tick(Date.now()),this._active=!1,this._notify(!1))}tick(e){let n=e-this._start,s=this._duration,o=this._prop,r=this._from,i=this._loop,a=this._to,l;if(this._active=r!==a&&(i||n<s),!this._active){this._target[o]=a,this._notify(!0);return}if(n<0){this._target[o]=r;return}l=n/s%2,l=i&&l>1?2-l:l,l=this._easing(Math.min(1,Math.max(0,l))),this._target[o]=this._fn(r,a,l)}wait(){let e=this._promises||(this._promises=[]);return new Promise((n,s)=>{e.push({res:n,rej:s})})}_notify(e){let n=e?"res":"rej",s=this._promises||[];for(let o=0;o<s.length;o++)s[o][n]()}},Zl=class{constructor(e,n){this._chart=e,this._properties=new Map,this.configure(n)}configure(e){if(!Ae(e))return;let n=Object.keys(Qe.animation),s=this._properties;Object.getOwnPropertyNames(e).forEach(o=>{let r=e[o];if(!Ae(r))return;let i={};for(let a of n)i[a]=r[a];(Ze(r.properties)&&r.properties||[o]).forEach(a=>{(a===o||!s.has(a))&&s.set(a,i)})})}_animateOptions(e,n){let s=n.options,o=R5(e,s);if(!o)return[];let r=this._createAnimations(o,s);return s.$shared&&P5(e.options.$animations,s).then(()=>{e.options=s},()=>{}),r}_createAnimations(e,n){let s=this._properties,o=[],r=e.$animations||(e.$animations={}),i=Object.keys(n),a=Date.now(),l;for(l=i.length-1;l>=0;--l){let c=i[l];if(c.charAt(0)==="$")continue;if(c==="options"){o.push(...this._animateOptions(e,n));continue}let d=n[c],u=r[c],p=s.get(c);if(u)if(p&&u.active()){u.update(p,d,a);continue}else u.cancel();if(!p||!p.duration){e[c]=d;continue}r[c]=u=new ip(p,e,c,d),o.push(u)}return o}update(e,n){if(this._properties.size===0){Object.assign(e,n);return}let s=this._createAnimations(e,n);if(s.length)return is.add(this._chart,s),!0}};function P5(t,e){let n=[],s=Object.keys(e);for(let o=0;o<s.length;o++){let r=t[s[o]];r&&r.active()&&n.push(r.wait())}return Promise.all(n)}function R5(t,e){if(!e)return;let n=t.options;if(!n){t.options=e;return}return n.$shared&&(t.options=n=Object.assign({},n,{$shared:!1,$animations:{}})),n}function Jv(t,e){let n=t&&t.options||{},s=n.reverse,o=n.min===void 0?e:0,r=n.max===void 0?e:0;return{start:s?r:o,end:s?o:r}}function L5(t,e,n){if(n===!1)return!1;let s=Jv(t,n),o=Jv(e,n);return{top:o.end,right:s.end,bottom:o.start,left:s.start}}function E5(t){let e,n,s,o;return Ae(t)?(e=t.top,n=t.right,s=t.bottom,o=t.left):e=n=s=o=t,{top:e,right:n,bottom:s,left:o,disabled:t===!1}}function G$(t,e){let n=[],s=t._getSortedDatasetMetas(e),o,r;for(o=0,r=s.length;o<r;++o)n.push(s[o].index);return n}function Zv(t,e,n,s={}){let o=t.keys,r=s.mode==="single",i,a,l,c;if(e===null)return;let d=!1;for(i=0,a=o.length;i<a;++i){if(l=+o[i],l===n){if(d=!0,s.all)continue;break}c=t.values[l],at(c)&&(r||e===0||wn(e)===wn(c))&&(e+=c)}return!d&&!s.all?0:e}function I5(t,e){let{iScale:n,vScale:s}=e,o=n.axis==="x"?"x":"y",r=s.axis==="x"?"x":"y",i=Object.keys(t),a=new Array(i.length),l,c,d;for(l=0,c=i.length;l<c;++l)d=i[l],a[l]={[o]:d,[r]:t[d]};return a}function qu(t,e){let n=t&&t.options.stacked;return n||n===void 0&&e.stack!==void 0}function D5(t,e,n){return`${t.id}.${e.id}.${n.stack||n.type}`}function N5(t){let{min:e,max:n,minDefined:s,maxDefined:o}=t.getUserBounds();return{min:s?e:Number.NEGATIVE_INFINITY,max:o?n:Number.POSITIVE_INFINITY}}function O5(t,e,n){let s=t[e]||(t[e]={});return s[n]||(s[n]={})}function Yv(t,e,n,s){for(let o of e.getMatchingVisibleMetas(s).reverse()){let r=t[o.index];if(n&&r>0||!n&&r<0)return o.index}return null}function Xv(t,e){let{chart:n,_cachedMeta:s}=t,o=n._stacks||(n._stacks={}),{iScale:r,vScale:i,index:a}=s,l=r.axis,c=i.axis,d=D5(r,i,s),u=e.length,p;for(let f=0;f<u;++f){let g=e[f],{[l]:m,[c]:h}=g,b=g._stacks||(g._stacks={});p=b[c]=O5(o,d,m),p[a]=h,p._top=Yv(p,i,!0,s.type),p._bottom=Yv(p,i,!1,s.type);let x=p._visualValues||(p._visualValues={});x[a]=h}}function Ju(t,e){let n=t.scales;return Object.keys(n).filter(s=>n[s].axis===e).shift()}function B5(t,e){return rs(t,{active:!1,dataset:void 0,datasetIndex:e,index:e,mode:"default",type:"dataset"})}function F5(t,e,n){return rs(t,{active:!1,dataIndex:e,parsed:void 0,raw:void 0,element:n,index:e,mode:"default",type:"data"})}function yi(t,e){let n=t.controller.index,s=t.vScale&&t.vScale.axis;if(s){e=e||t._parsed;for(let o of e){let r=o._stacks;if(!r||r[s]===void 0||r[s][n]===void 0)return;delete r[s][n],r[s]._visualValues!==void 0&&r[s]._visualValues[n]!==void 0&&delete r[s]._visualValues[n]}}}var Zu=t=>t==="reset"||t==="none",Qv=(t,e)=>e?t:Object.assign({},t),H5=(t,e,n)=>t&&!e.hidden&&e._stacked&&{keys:G$(n,!0),values:null},Wn=class{static defaults={};static datasetElementType=null;static dataElementType=null;constructor(e,n){this.chart=e,this._ctx=e.ctx,this.index=n,this._cachedDataOpts={},this._cachedMeta=this.getMeta(),this._type=this._cachedMeta.type,this.options=void 0,this._parsing=!1,this._data=void 0,this._objectData=void 0,this._sharedOptions=void 0,this._drawStart=void 0,this._drawCount=void 0,this.enableOptionSharing=!1,this.supportsDecimation=!1,this.$context=void 0,this._syncList=[],this.datasetElementType=new.target.datasetElementType,this.dataElementType=new.target.dataElementType,this.initialize()}initialize(){let e=this._cachedMeta;this.configure(),this.linkScales(),e._stacked=qu(e.vScale,e),this.addElements(),this.options.fill&&!this.chart.isPluginEnabled("filler")&&console.warn("Tried to use the 'fill' option without the 'Filler' plugin enabled. Please import and register the 'Filler' plugin and make sure it is not disabled in the options")}updateIndex(e){this.index!==e&&yi(this._cachedMeta),this.index=e}linkScales(){let e=this.chart,n=this._cachedMeta,s=this.getDataset(),o=(u,p,f,g)=>u==="x"?p:u==="r"?g:f,r=n.xAxisID=$e(s.xAxisID,Ju(e,"x")),i=n.yAxisID=$e(s.yAxisID,Ju(e,"y")),a=n.rAxisID=$e(s.rAxisID,Ju(e,"r")),l=n.indexAxis,c=n.iAxisID=o(l,r,i,a),d=n.vAxisID=o(l,i,r,a);n.xScale=this.getScaleForId(r),n.yScale=this.getScaleForId(i),n.rScale=this.getScaleForId(a),n.iScale=this.getScaleForId(c),n.vScale=this.getScaleForId(d)}getDataset(){return this.chart.data.datasets[this.index]}getMeta(){return this.chart.getDatasetMeta(this.index)}getScaleForId(e){return this.chart.scales[e]}_getOtherScale(e){let n=this._cachedMeta;return e===n.iScale?n.vScale:n.iScale}reset(){this._update("reset")}_destroy(){let e=this._cachedMeta;this._data&&_u(this._data,this),e._stacked&&yi(e)}_dataCheck(){let e=this.getDataset(),n=e.data||(e.data=[]),s=this._data;if(Ae(n)){let o=this._cachedMeta;this._data=I5(n,o)}else if(s!==n){if(s){_u(s,this);let o=this._cachedMeta;yi(o),o._parsed=[]}n&&Object.isExtensible(n)&&Tv(n,this),this._syncList=[],this._data=n}}addElements(){let e=this._cachedMeta;this._dataCheck(),this.datasetElementType&&(e.dataset=new this.datasetElementType)}buildOrUpdateElements(e){let n=this._cachedMeta,s=this.getDataset(),o=!1;this._dataCheck();let r=n._stacked;n._stacked=qu(n.vScale,n),n.stack!==s.stack&&(o=!0,yi(n),n.stack=s.stack),this._resyncElements(e),(o||r!==n._stacked)&&(Xv(this,n._parsed),n._stacked=qu(n.vScale,n))}configure(){let e=this.chart.config,n=e.datasetScopeKeys(this._type),s=e.getOptionScopes(this.getDataset(),n,!0);this.options=e.createResolver(s,this.getContext()),this._parsing=this.options.parsing,this._cachedDataOpts={}}parse(e,n){let{_cachedMeta:s,_data:o}=this,{iScale:r,_stacked:i}=s,a=r.axis,l=e===0&&n===o.length?!0:s._sorted,c=e>0&&s._parsed[e-1],d,u,p;if(this._parsing===!1)s._parsed=o,s._sorted=!0,p=o;else{Ze(o[e])?p=this.parseArrayData(s,o,e,n):Ae(o[e])?p=this.parseObjectData(s,o,e,n):p=this.parsePrimitiveData(s,o,e,n);let f=()=>u[a]===null||c&&u[a]<c[a];for(d=0;d<n;++d)s._parsed[d+e]=u=p[d],l&&(f()&&(l=!1),c=u);s._sorted=l}i&&Xv(this,p)}parsePrimitiveData(e,n,s,o){let{iScale:r,vScale:i}=e,a=r.axis,l=i.axis,c=r.getLabels(),d=r===i,u=new Array(o),p,f,g;for(p=0,f=o;p<f;++p)g=p+s,u[p]={[a]:d||r.parse(c[g],g),[l]:i.parse(n[g],g)};return u}parseArrayData(e,n,s,o){let{xScale:r,yScale:i}=e,a=new Array(o),l,c,d,u;for(l=0,c=o;l<c;++l)d=l+s,u=n[d],a[l]={x:r.parse(u[0],d),y:i.parse(u[1],d)};return a}parseObjectData(e,n,s,o){let{xScale:r,yScale:i}=e,{xAxisKey:a="x",yAxisKey:l="y"}=this._parsing,c=new Array(o),d,u,p,f;for(d=0,u=o;d<u;++d)p=d+s,f=n[p],c[d]={x:r.parse(os(f,a),p),y:i.parse(os(f,l),p)};return c}getParsed(e){return this._cachedMeta._parsed[e]}getDataElement(e){return this._cachedMeta.data[e]}applyStack(e,n,s){let o=this.chart,r=this._cachedMeta,i=n[e.axis],a={keys:G$(o,!0),values:n._stacks[e.axis]._visualValues};return Zv(a,i,r.index,{mode:s})}updateRangeFromParsed(e,n,s,o){let r=s[n.axis],i=r===null?NaN:r,a=o&&s._stacks[n.axis];o&&a&&(o.values=a,i=Zv(o,r,this._cachedMeta.index)),e.min=Math.min(e.min,i),e.max=Math.max(e.max,i)}getMinMax(e,n){let s=this._cachedMeta,o=s._parsed,r=s._sorted&&e===s.iScale,i=o.length,a=this._getOtherScale(e),l=H5(n,s,this.chart),c={min:Number.POSITIVE_INFINITY,max:Number.NEGATIVE_INFINITY},{min:d,max:u}=N5(a),p,f;function g(){f=o[p];let m=f[a.axis];return!at(f[e.axis])||d>m||u<m}for(p=0;p<i&&!(!g()&&(this.updateRangeFromParsed(c,e,f,l),r));++p);if(r){for(p=i-1;p>=0;--p)if(!g()){this.updateRangeFromParsed(c,e,f,l);break}}return c}getAllParsedValues(e){let n=this._cachedMeta._parsed,s=[],o,r,i;for(o=0,r=n.length;o<r;++o)i=n[o][e.axis],at(i)&&s.push(i);return s}getMaxOverflow(){return!1}getLabelAndValue(e){let n=this._cachedMeta,s=n.iScale,o=n.vScale,r=this.getParsed(e);return{label:s?""+s.getLabelForValue(r[s.axis]):"",value:o?""+o.getLabelForValue(r[o.axis]):""}}_update(e){let n=this._cachedMeta;this.update(e||"default"),n._clip=E5($e(this.options.clip,L5(n.xScale,n.yScale,this.getMaxOverflow())))}update(e){}draw(){let e=this._ctx,n=this.chart,s=this._cachedMeta,o=s.data||[],r=n.chartArea,i=[],a=this._drawStart||0,l=this._drawCount||o.length-a,c=this.options.drawActiveElementsOnTop,d;for(s.dataset&&s.dataset.draw(e,r,a,l),d=a;d<a+l;++d){let u=o[d];u.hidden||(u.active&&c?i.push(u):u.draw(e,r))}for(d=0;d<i.length;++d)i[d].draw(e,r)}getStyle(e,n){let s=n?"active":"default";return e===void 0&&this._cachedMeta.dataset?this.resolveDatasetElementOptions(s):this.resolveDataElementOptions(e||0,s)}getContext(e,n,s){let o=this.getDataset(),r;if(e>=0&&e<this._cachedMeta.data.length){let i=this._cachedMeta.data[e];r=i.$context||(i.$context=F5(this.getContext(),e,i)),r.parsed=this.getParsed(e),r.raw=o.data[e],r.index=r.dataIndex=e}else r=this.$context||(this.$context=B5(this.chart.getContext(),this.index)),r.dataset=o,r.index=r.datasetIndex=this.index;return r.active=!!n,r.mode=s,r}resolveDatasetElementOptions(e){return this._resolveElementOptions(this.datasetElementType.id,e)}resolveDataElementOptions(e,n){return this._resolveElementOptions(this.dataElementType.id,n,e)}_resolveElementOptions(e,n="default",s){let o=n==="active",r=this._cachedDataOpts,i=e+"-"+n,a=r[i],l=this.enableOptionSharing&&ir(s);if(a)return Qv(a,l);let c=this.chart.config,d=c.datasetElementScopeKeys(this._type,e),u=o?[`${e}Hover`,"hover",e,""]:[e,""],p=c.getOptionScopes(this.getDataset(),d),f=Object.keys(Qe.elements[e]),g=()=>this.getContext(s,o,n),m=c.resolveNamedOptions(p,f,g,u);return m.$shared&&(m.$shared=l,r[i]=Object.freeze(Qv(m,l))),m}_resolveAnimations(e,n,s){let o=this.chart,r=this._cachedDataOpts,i=`animation-${n}`,a=r[i];if(a)return a;let l;if(o.options.animation!==!1){let d=this.chart.config,u=d.datasetAnimationScopeKeys(this._type,n),p=d.getOptionScopes(this.getDataset(),u);l=d.createResolver(p,this.getContext(e,s,n))}let c=new Zl(o,l&&l.animations);return l&&l._cacheable&&(r[i]=Object.freeze(c)),c}getSharedOptions(e){if(e.$shared)return this._sharedOptions||(this._sharedOptions=Object.assign({},e))}includeOptions(e,n){return!n||Zu(e)||this.chart._animationsDisabled}_getSharedOptions(e,n){let s=this.resolveDataElementOptions(e,n),o=this._sharedOptions,r=this.getSharedOptions(s),i=this.includeOptions(n,r)||r!==o;return this.updateSharedOptions(r,n,s),{sharedOptions:r,includeOptions:i}}updateElement(e,n,s,o){Zu(o)?Object.assign(e,s):this._resolveAnimations(n,o).update(e,s)}updateSharedOptions(e,n,s){e&&!Zu(n)&&this._resolveAnimations(void 0,n).update(e,s)}_setStyle(e,n,s,o){e.active=o;let r=this.getStyle(n,o);this._resolveAnimations(n,s,o).update(e,{options:!o&&this.getSharedOptions(r)||r})}removeHoverStyle(e,n,s){this._setStyle(e,s,"active",!1)}setHoverStyle(e,n,s){this._setStyle(e,s,"active",!0)}_removeDatasetHoverStyle(){let e=this._cachedMeta.dataset;e&&this._setStyle(e,void 0,"active",!1)}_setDatasetHoverStyle(){let e=this._cachedMeta.dataset;e&&this._setStyle(e,void 0,"active",!0)}_resyncElements(e){let n=this._data,s=this._cachedMeta.data;for(let[a,l,c]of this._syncList)this[a](l,c);this._syncList=[];let o=s.length,r=n.length,i=Math.min(r,o);i&&this.parse(0,i),r>o?this._insertElements(o,r-o,e):r<o&&this._removeElements(r,o-r)}_insertElements(e,n,s=!0){let o=this._cachedMeta,r=o.data,i=e+n,a,l=c=>{for(c.length+=n,a=c.length-1;a>=i;a--)c[a]=c[a-n]};for(l(r),a=e;a<i;++a)r[a]=new this.dataElementType;this._parsing&&l(o._parsed),this.parse(e,n),s&&this.updateElements(r,e,n,"reset")}updateElements(e,n,s,o){}_removeElements(e,n){let s=this._cachedMeta;if(this._parsing){let o=s._parsed.splice(e,n);s._stacked&&yi(s,o)}s.data.splice(e,n)}_sync(e){if(this._parsing)this._syncList.push(e);else{let[n,s,o]=e;this[n](s,o)}this.chart._dataChanges.push([this.index,...e])}_onDataPush(){let e=arguments.length;this._sync(["_insertElements",this.getDataset().data.length-e,e])}_onDataPop(){this._sync(["_removeElements",this._cachedMeta.data.length-1,1])}_onDataShift(){this._sync(["_removeElements",0,1])}_onDataSplice(e,n){n&&this._sync(["_removeElements",e,n]);let s=arguments.length-2;s&&this._sync(["_insertElements",e,s])}_onDataUnshift(){this._sync(["_insertElements",0,arguments.length])}};function W5(t,e){if(!t._cache.$bar){let n=t.getMatchingVisibleMetas(e),s=[];for(let o=0,r=n.length;o<r;o++)s=s.concat(n[o].controller.getAllParsedValues(t));t._cache.$bar=Mu(s.sort((o,r)=>o-r))}return t._cache.$bar}function V5(t){let e=t.iScale,n=W5(e,t.type),s=e._length,o,r,i,a,l=()=>{i===32767||i===-32768||(ir(a)&&(s=Math.min(s,Math.abs(i-a)||s)),a=i)};for(o=0,r=n.length;o<r;++o)i=e.getPixelForValue(n[o]),l();for(a=void 0,o=0,r=e.ticks.length;o<r;++o)i=e.getPixelForTick(o),l();return s}function j5(t,e,n,s){let o=n.barThickness,r,i;return _e(o)?(r=e.min*n.categoryPercentage,i=n.barPercentage):(r=o*s,i=1),{chunk:r/s,ratio:i,start:e.pixels[t]-r/2}}function z5(t,e,n,s){let o=e.pixels,r=o[t],i=t>0?o[t-1]:null,a=t<o.length-1?o[t+1]:null,l=n.categoryPercentage;i===null&&(i=r-(a===null?e.end-e.start:a-r)),a===null&&(a=r+r-i);let c=r-(r-Math.min(i,a))/2*l;return{chunk:Math.abs(a-i)/2*l/s,ratio:n.barPercentage,start:c}}function U5(t,e,n,s){let o=n.parse(t[0],s),r=n.parse(t[1],s),i=Math.min(o,r),a=Math.max(o,r),l=i,c=a;Math.abs(i)>Math.abs(a)&&(l=a,c=i),e[n.axis]=c,e._custom={barStart:l,barEnd:c,start:o,end:r,min:i,max:a}}function q$(t,e,n,s){return Ze(t)?U5(t,e,n,s):e[n.axis]=n.parse(t,s),e}function e$(t,e,n,s){let o=t.iScale,r=t.vScale,i=o.getLabels(),a=o===r,l=[],c,d,u,p;for(c=n,d=n+s;c<d;++c)p=e[c],u={},u[o.axis]=a||o.parse(i[c],c),l.push(q$(p,u,r,c));return l}function Yu(t){return t&&t.barStart!==void 0&&t.barEnd!==void 0}function K5(t,e,n){return t!==0?wn(t):(e.isHorizontal()?1:-1)*(e.min>=n?1:-1)}function G5(t){let e,n,s,o,r;return t.horizontal?(e=t.base>t.x,n="left",s="right"):(e=t.base<t.y,n="bottom",s="top"),e?(o="end",r="start"):(o="start",r="end"),{start:n,end:s,reverse:e,top:o,bottom:r}}function q5(t,e,n,s){let o=e.borderSkipped,r={};if(!o){t.borderSkipped=r;return}if(o===!0){t.borderSkipped={top:!0,right:!0,bottom:!0,left:!0};return}let{start:i,end:a,reverse:l,top:c,bottom:d}=G5(t);o==="middle"&&n&&(t.enableBorderRadius=!0,(n._top||0)===s?o=c:(n._bottom||0)===s?o=d:(r[t$(d,i,a,l)]=!0,o=c)),r[t$(o,i,a,l)]=!0,t.borderSkipped=r}function t$(t,e,n,s){return s?(t=J5(t,e,n),t=n$(t,n,e)):t=n$(t,e,n),t}function J5(t,e,n){return t===e?n:t===n?e:t}function n$(t,e,n){return t==="start"?e:t==="end"?n:t}function Z5(t,{inflateAmount:e},n){t.inflateAmount=e==="auto"?n===1?.33:0:e}var ap=class extends Wn{static id="bar";static defaults={datasetElementType:!1,dataElementType:"bar",categoryPercentage:.8,barPercentage:.9,grouped:!0,animations:{numbers:{type:"number",properties:["x","y","base","width","height"]}}};static overrides={scales:{_index_:{type:"category",offset:!0,grid:{offset:!0}},_value_:{type:"linear",beginAtZero:!0}}};parsePrimitiveData(e,n,s,o){return e$(e,n,s,o)}parseArrayData(e,n,s,o){return e$(e,n,s,o)}parseObjectData(e,n,s,o){let{iScale:r,vScale:i}=e,{xAxisKey:a="x",yAxisKey:l="y"}=this._parsing,c=r.axis==="x"?a:l,d=i.axis==="x"?a:l,u=[],p,f,g,m;for(p=s,f=s+o;p<f;++p)m=n[p],g={},g[r.axis]=r.parse(os(m,c),p),u.push(q$(os(m,d),g,i,p));return u}updateRangeFromParsed(e,n,s,o){super.updateRangeFromParsed(e,n,s,o);let r=s._custom;r&&n===this._cachedMeta.vScale&&(e.min=Math.min(e.min,r.min),e.max=Math.max(e.max,r.max))}getMaxOverflow(){return 0}getLabelAndValue(e){let n=this._cachedMeta,{iScale:s,vScale:o}=n,r=this.getParsed(e),i=r._custom,a=Yu(i)?"["+i.start+", "+i.end+"]":""+o.getLabelForValue(r[o.axis]);return{label:""+s.getLabelForValue(r[s.axis]),value:a}}initialize(){this.enableOptionSharing=!0,super.initialize();let e=this._cachedMeta;e.stack=this.getDataset().stack}update(e){let n=this._cachedMeta;this.updateElements(n.data,0,n.data.length,e)}updateElements(e,n,s,o){let r=o==="reset",{index:i,_cachedMeta:{vScale:a}}=this,l=a.getBasePixel(),c=a.isHorizontal(),d=this._getRuler(),{sharedOptions:u,includeOptions:p}=this._getSharedOptions(n,o);for(let f=n;f<n+s;f++){let g=this.getParsed(f),m=r||_e(g[a.axis])?{base:l,head:l}:this._calculateBarValuePixels(f),h=this._calculateBarIndexPixels(f,d),b=(g._stacks||{})[a.axis],x={horizontal:c,base:m.base,enableBorderRadius:!b||Yu(g._custom)||i===b._top||i===b._bottom,x:c?m.head:h.center,y:c?h.center:m.head,height:c?h.size:Math.abs(m.size),width:c?Math.abs(m.size):h.size};p&&(x.options=u||this.resolveDataElementOptions(f,e[f].active?"active":o));let v=x.options||e[f].options;q5(x,v,b,i),Z5(x,v,d.ratio),this.updateElement(e[f],f,x,o)}}_getStacks(e,n){let{iScale:s}=this._cachedMeta,o=s.getMatchingVisibleMetas(this._type).filter(d=>d.controller.options.grouped),r=s.options.stacked,i=[],a=this._cachedMeta.controller.getParsed(n),l=a&&a[s.axis],c=d=>{let u=d._parsed.find(f=>f[s.axis]===l),p=u&&u[d.vScale.axis];if(_e(p)||isNaN(p))return!0};for(let d of o)if(!(n!==void 0&&c(d))&&((r===!1||i.indexOf(d.stack)===-1||r===void 0&&d.stack===void 0)&&i.push(d.stack),d.index===e))break;return i.length||i.push(void 0),i}_getStackCount(e){return this._getStacks(void 0,e).length}_getAxisCount(){return this._getAxis().length}getFirstScaleIdForIndexAxis(){let e=this.chart.scales,n=this.chart.options.indexAxis;return Object.keys(e).filter(s=>e[s].axis===n).shift()}_getAxis(){let e={},n=this.getFirstScaleIdForIndexAxis();for(let s of this.chart.data.datasets)e[$e(this.chart.options.indexAxis==="x"?s.xAxisID:s.yAxisID,n)]=!0;return Object.keys(e)}_getStackIndex(e,n,s){let o=this._getStacks(e,s),r=n!==void 0?o.indexOf(n):-1;return r===-1?o.length-1:r}_getRuler(){let e=this.options,n=this._cachedMeta,s=n.iScale,o=[],r,i;for(r=0,i=n.data.length;r<i;++r)o.push(s.getPixelForValue(this.getParsed(r)[s.axis],r));let a=e.barThickness;return{min:a||V5(n),pixels:o,start:s._startPixel,end:s._endPixel,stackCount:this._getStackCount(),scale:s,grouped:e.grouped,ratio:a?1:e.categoryPercentage*e.barPercentage}}_calculateBarValuePixels(e){let{_cachedMeta:{vScale:n,_stacked:s,index:o},options:{base:r,minBarLength:i}}=this,a=r||0,l=this.getParsed(e),c=l._custom,d=Yu(c),u=l[n.axis],p=0,f=s?this.applyStack(n,l,s):u,g,m;f!==u&&(p=f-u,f=u),d&&(u=c.barStart,f=c.barEnd-c.barStart,u!==0&&wn(u)!==wn(c.barEnd)&&(p=0),p+=u);let h=!_e(r)&&!d?r:p,b=n.getPixelForValue(h);if(this.chart.getDataVisibility(e)?g=n.getPixelForValue(p+f):g=b,m=g-b,Math.abs(m)<i){m=K5(m,n,a)*i,u===a&&(b-=m/2);let x=n.getPixelForDecimal(0),v=n.getPixelForDecimal(1),w=Math.min(x,v),$=Math.max(x,v);b=Math.max(Math.min(b,$),w),g=b+m,s&&!d&&(l._stacks[n.axis]._visualValues[o]=n.getValueForPixel(g)-n.getValueForPixel(b))}if(b===n.getPixelForValue(a)){let x=wn(m)*n.getLineWidthForValue(a)/2;b+=x,m-=x}return{size:m,base:b,head:g,center:g+m/2}}_calculateBarIndexPixels(e,n){let s=n.scale,o=this.options,r=o.skipNull,i=$e(o.maxBarThickness,1/0),a,l,c=this._getAxisCount();if(n.grouped){let d=r?this._getStackCount(e):n.stackCount,u=o.barThickness==="flex"?z5(e,n,o,d*c):j5(e,n,o,d*c),p=this.chart.options.indexAxis==="x"?this.getDataset().xAxisID:this.getDataset().yAxisID,f=this._getAxis().indexOf($e(p,this.getFirstScaleIdForIndexAxis())),g=this._getStackIndex(this.index,this._cachedMeta.stack,r?e:void 0)+f;a=u.start+u.chunk*g+u.chunk/2,l=Math.min(i,u.chunk*u.ratio)}else a=s.getPixelForValue(this.getParsed(e)[s.axis],e),l=Math.min(i,n.min*n.ratio);return{base:a-l/2,head:a+l/2,center:a,size:l}}draw(){let e=this._cachedMeta,n=e.vScale,s=e.data,o=s.length,r=0;for(;r<o;++r)this.getParsed(r)[n.axis]!==null&&!s[r].hidden&&s[r].draw(this._ctx)}},lp=class extends Wn{static id="bubble";static defaults={datasetElementType:!1,dataElementType:"point",animations:{numbers:{type:"number",properties:["x","y","borderWidth","radius"]}}};static overrides={scales:{x:{type:"linear"},y:{type:"linear"}}};initialize(){this.enableOptionSharing=!0,super.initialize()}parsePrimitiveData(e,n,s,o){let r=super.parsePrimitiveData(e,n,s,o);for(let i=0;i<r.length;i++)r[i]._custom=this.resolveDataElementOptions(i+s).radius;return r}parseArrayData(e,n,s,o){let r=super.parseArrayData(e,n,s,o);for(let i=0;i<r.length;i++){let a=n[s+i];r[i]._custom=$e(a[2],this.resolveDataElementOptions(i+s).radius)}return r}parseObjectData(e,n,s,o){let r=super.parseObjectData(e,n,s,o);for(let i=0;i<r.length;i++){let a=n[s+i];r[i]._custom=$e(a&&a.r&&+a.r,this.resolveDataElementOptions(i+s).radius)}return r}getMaxOverflow(){let e=this._cachedMeta.data,n=0;for(let s=e.length-1;s>=0;--s)n=Math.max(n,e[s].size(this.resolveDataElementOptions(s))/2);return n>0&&n}getLabelAndValue(e){let n=this._cachedMeta,s=this.chart.data.labels||[],{xScale:o,yScale:r}=n,i=this.getParsed(e),a=o.getLabelForValue(i.x),l=r.getLabelForValue(i.y),c=i._custom;return{label:s[e]||"",value:"("+a+", "+l+(c?", "+c:"")+")"}}update(e){let n=this._cachedMeta.data;this.updateElements(n,0,n.length,e)}updateElements(e,n,s,o){let r=o==="reset",{iScale:i,vScale:a}=this._cachedMeta,{sharedOptions:l,includeOptions:c}=this._getSharedOptions(n,o),d=i.axis,u=a.axis;for(let p=n;p<n+s;p++){let f=e[p],g=!r&&this.getParsed(p),m={},h=m[d]=r?i.getPixelForDecimal(.5):i.getPixelForValue(g[d]),b=m[u]=r?a.getBasePixel():a.getPixelForValue(g[u]);m.skip=isNaN(h)||isNaN(b),c&&(m.options=l||this.resolveDataElementOptions(p,f.active?"active":o),r&&(m.options.radius=0)),this.updateElement(f,p,m,o)}}resolveDataElementOptions(e,n){let s=this.getParsed(e),o=super.resolveDataElementOptions(e,n);o.$shared&&(o=Object.assign({},o,{$shared:!1}));let r=o.radius;return n!=="active"&&(o.radius=0),o.radius+=$e(s&&s._custom,r),o}};function Y5(t,e,n){let s=1,o=1,r=0,i=0;if(e<Ye){let a=t,l=a+e,c=Math.cos(a),d=Math.sin(a),u=Math.cos(l),p=Math.sin(l),f=(v,w,$)=>lr(v,a,l,!0)?1:Math.max(w,w*n,$,$*n),g=(v,w,$)=>lr(v,a,l,!0)?-1:Math.min(w,w*n,$,$*n),m=f(0,c,u),h=f(dt,d,p),b=g(Oe,c,u),x=g(Oe+dt,d,p);s=(m-b)/2,o=(h-x)/2,r=-(m+b)/2,i=-(h+x)/2}return{ratioX:s,ratioY:o,offsetX:r,offsetY:i}}var _i=class extends Wn{static id="doughnut";static defaults={datasetElementType:!1,dataElementType:"arc",animation:{animateRotate:!0,animateScale:!1},animations:{numbers:{type:"number",properties:["circumference","endAngle","innerRadius","outerRadius","startAngle","x","y","offset","borderWidth","spacing"]}},cutout:"50%",rotation:0,circumference:360,radius:"100%",spacing:0,indexAxis:"r"};static descriptors={_scriptable:e=>e!=="spacing",_indexable:e=>e!=="spacing"&&!e.startsWith("borderDash")&&!e.startsWith("hoverBorderDash")};static overrides={aspectRatio:1,plugins:{legend:{labels:{generateLabels(e){let n=e.data,{labels:{pointStyle:s,textAlign:o,color:r,useBorderRadius:i,borderRadius:a}}=e.legend.options;return n.labels.length&&n.datasets.length?n.labels.map((l,c)=>{let u=e.getDatasetMeta(0).controller.getStyle(c);return{text:l,fillStyle:u.backgroundColor,fontColor:r,hidden:!e.getDataVisibility(c),lineDash:u.borderDash,lineDashOffset:u.borderDashOffset,lineJoin:u.borderJoinStyle,lineWidth:u.borderWidth,strokeStyle:u.borderColor,textAlign:o,pointStyle:s,borderRadius:i&&(a||u.borderRadius),index:c}}):[]}},onClick(e,n,s){s.chart.toggleDataVisibility(n.index),s.chart.update()}}}};constructor(e,n){super(e,n),this.enableOptionSharing=!0,this.innerRadius=void 0,this.outerRadius=void 0,this.offsetX=void 0,this.offsetY=void 0}linkScales(){}parse(e,n){let s=this.getDataset().data,o=this._cachedMeta;if(this._parsing===!1)o._parsed=s;else{let r=l=>+s[l];if(Ae(s[e])){let{key:l="value"}=this._parsing;r=c=>+os(s[c],l)}let i,a;for(i=e,a=e+n;i<a;++i)o._parsed[i]=r(i)}}_getRotation(){return pn(this.options.rotation-90)}_getCircumference(){return pn(this.options.circumference)}_getRotationExtents(){let e=Ye,n=-Ye;for(let s=0;s<this.chart.data.datasets.length;++s)if(this.chart.isDatasetVisible(s)&&this.chart.getDatasetMeta(s).type===this._type){let o=this.chart.getDatasetMeta(s).controller,r=o._getRotation(),i=o._getCircumference();e=Math.min(e,r),n=Math.max(n,r+i)}return{rotation:e,circumference:n-e}}update(e){let n=this.chart,{chartArea:s}=n,o=this._cachedMeta,r=o.data,i=this.getMaxBorderWidth()+this.getMaxOffset(r)+this.options.spacing,a=Math.max((Math.min(s.width,s.height)-i)/2,0),l=Math.min(vv(this.options.cutout,a),1),c=this._getRingWeight(this.index),{circumference:d,rotation:u}=this._getRotationExtents(),{ratioX:p,ratioY:f,offsetX:g,offsetY:m}=Y5(u,d,l),h=(s.width-i)/p,b=(s.height-i)/f,x=Math.max(Math.min(h,b)/2,0),v=vu(this.options.radius,x),w=Math.max(v*l,0),$=(v-w)/this._getVisibleDatasetWeightTotal();this.offsetX=g*v,this.offsetY=m*v,o.total=this.calculateTotal(),this.outerRadius=v-$*this._getRingWeightOffset(this.index),this.innerRadius=Math.max(this.outerRadius-$*c,0),this.updateElements(r,0,r.length,e)}_circumference(e,n){let s=this.options,o=this._cachedMeta,r=this._getCircumference();return n&&s.animation.animateRotate||!this.chart.getDataVisibility(e)||o._parsed[e]===null||o.data[e].hidden?0:this.calculateCircumference(o._parsed[e]*r/Ye)}updateElements(e,n,s,o){let r=o==="reset",i=this.chart,a=i.chartArea,c=i.options.animation,d=(a.left+a.right)/2,u=(a.top+a.bottom)/2,p=r&&c.animateScale,f=p?0:this.innerRadius,g=p?0:this.outerRadius,{sharedOptions:m,includeOptions:h}=this._getSharedOptions(n,o),b=this._getRotation(),x;for(x=0;x<n;++x)b+=this._circumference(x,r);for(x=n;x<n+s;++x){let v=this._circumference(x,r),w=e[x],$={x:d+this.offsetX,y:u+this.offsetY,startAngle:b,endAngle:b+v,circumference:v,outerRadius:g,innerRadius:f};h&&($.options=m||this.resolveDataElementOptions(x,w.active?"active":o)),b+=v,this.updateElement(w,x,$,o)}}calculateTotal(){let e=this._cachedMeta,n=e.data,s=0,o;for(o=0;o<n.length;o++){let r=e._parsed[o];r!==null&&!isNaN(r)&&this.chart.getDataVisibility(o)&&!n[o].hidden&&(s+=Math.abs(r))}return s}calculateCircumference(e){let n=this._cachedMeta.total;return n>0&&!isNaN(e)?Ye*(Math.abs(e)/n):0}getLabelAndValue(e){let n=this._cachedMeta,s=this.chart,o=s.data.labels||[],r=cr(n._parsed[e],s.options.locale);return{label:o[e]||"",value:r}}getMaxBorderWidth(e){let n=0,s=this.chart,o,r,i,a,l;if(!e){for(o=0,r=s.data.datasets.length;o<r;++o)if(s.isDatasetVisible(o)){i=s.getDatasetMeta(o),e=i.data,a=i.controller;break}}if(!e)return 0;for(o=0,r=e.length;o<r;++o)l=a.resolveDataElementOptions(o),l.borderAlign!=="inner"&&(n=Math.max(n,l.borderWidth||0,l.hoverBorderWidth||0));return n}getMaxOffset(e){let n=0;for(let s=0,o=e.length;s<o;++s){let r=this.resolveDataElementOptions(s);n=Math.max(n,r.offset||0,r.hoverOffset||0)}return n}_getRingWeightOffset(e){let n=0;for(let s=0;s<e;++s)this.chart.isDatasetVisible(s)&&(n+=this._getRingWeight(s));return n}_getRingWeight(e){return Math.max($e(this.chart.data.datasets[e].weight,1),0)}_getVisibleDatasetWeightTotal(){return this._getRingWeightOffset(this.chart.data.datasets.length)||1}},cp=class extends Wn{static id="line";static defaults={datasetElementType:"line",dataElementType:"point",showLine:!0,spanGaps:!1};static overrides={scales:{_index_:{type:"category"},_value_:{type:"linear"}}};initialize(){this.enableOptionSharing=!0,this.supportsDecimation=!0,super.initialize()}update(e){let n=this._cachedMeta,{dataset:s,data:o=[],_dataset:r}=n,i=this.chart._animationsDisabled,{start:a,count:l}=Pu(n,o,i);this._drawStart=a,this._drawCount=l,Ru(n)&&(a=0,l=o.length),s._chart=this.chart,s._datasetIndex=this.index,s._decimated=!!r._decimated,s.points=o;let c=this.resolveDatasetElementOptions(e);this.options.showLine||(c.borderWidth=0),c.segment=this.options.segment,this.updateElement(s,void 0,{animated:!i,options:c},e),this.updateElements(o,a,l,e)}updateElements(e,n,s,o){let r=o==="reset",{iScale:i,vScale:a,_stacked:l,_dataset:c}=this._cachedMeta,{sharedOptions:d,includeOptions:u}=this._getSharedOptions(n,o),p=i.axis,f=a.axis,{spanGaps:g,segment:m}=this.options,h=io(g)?g:Number.POSITIVE_INFINITY,b=this.chart._animationsDisabled||r||o==="none",x=n+s,v=e.length,w=n>0&&this.getParsed(n-1);for(let $=0;$<v;++$){let S=e[$],C=b?S:{};if($<n||$>=x){C.skip=!0;continue}let _=this.getParsed($),k=_e(_[f]),A=C[p]=i.getPixelForValue(_[p],$),O=C[f]=r||k?a.getBasePixel():a.getPixelForValue(l?this.applyStack(a,_,l):_[f],$);C.skip=isNaN(A)||isNaN(O)||k,C.stop=$>0&&Math.abs(_[p]-w[p])>h,m&&(C.parsed=_,C.raw=c.data[$]),u&&(C.options=d||this.resolveDataElementOptions($,S.active?"active":o)),b||this.updateElement(S,$,C,o),w=_}}getMaxOverflow(){let e=this._cachedMeta,n=e.dataset,s=n.options&&n.options.borderWidth||0,o=e.data||[];if(!o.length)return s;let r=o[0].size(this.resolveDataElementOptions(0)),i=o[o.length-1].size(this.resolveDataElementOptions(o.length-1));return Math.max(s,r,i)/2}draw(){let e=this._cachedMeta;e.dataset.updateControlPoints(this.chart.chartArea,e.iScale.axis),super.draw()}},Yl=class extends Wn{static id="polarArea";static defaults={dataElementType:"arc",animation:{animateRotate:!0,animateScale:!0},animations:{numbers:{type:"number",properties:["x","y","startAngle","endAngle","innerRadius","outerRadius"]}},indexAxis:"r",startAngle:0};static overrides={aspectRatio:1,plugins:{legend:{labels:{generateLabels(e){let n=e.data;if(n.labels.length&&n.datasets.length){let{labels:{pointStyle:s,color:o}}=e.legend.options;return n.labels.map((r,i)=>{let l=e.getDatasetMeta(0).controller.getStyle(i);return{text:r,fillStyle:l.backgroundColor,strokeStyle:l.borderColor,fontColor:o,lineWidth:l.borderWidth,pointStyle:s,hidden:!e.getDataVisibility(i),index:i}})}return[]}},onClick(e,n,s){s.chart.toggleDataVisibility(n.index),s.chart.update()}}},scales:{r:{type:"radialLinear",angleLines:{display:!1},beginAtZero:!0,grid:{circular:!0},pointLabels:{display:!1},startAngle:0}}};constructor(e,n){super(e,n),this.innerRadius=void 0,this.outerRadius=void 0}getLabelAndValue(e){let n=this._cachedMeta,s=this.chart,o=s.data.labels||[],r=cr(n._parsed[e].r,s.options.locale);return{label:o[e]||"",value:r}}parseObjectData(e,n,s,o){return Hu.bind(this)(e,n,s,o)}update(e){let n=this._cachedMeta.data;this._updateRadius(),this.updateElements(n,0,n.length,e)}getMinMax(){let e=this._cachedMeta,n={min:Number.POSITIVE_INFINITY,max:Number.NEGATIVE_INFINITY};return e.data.forEach((s,o)=>{let r=this.getParsed(o).r;!isNaN(r)&&this.chart.getDataVisibility(o)&&(r<n.min&&(n.min=r),r>n.max&&(n.max=r))}),n}_updateRadius(){let e=this.chart,n=e.chartArea,s=e.options,o=Math.min(n.right-n.left,n.bottom-n.top),r=Math.max(o/2,0),i=Math.max(s.cutoutPercentage?r/100*s.cutoutPercentage:1,0),a=(r-i)/e.getVisibleDatasetCount();this.outerRadius=r-a*this.index,this.innerRadius=this.outerRadius-a}updateElements(e,n,s,o){let r=o==="reset",i=this.chart,l=i.options.animation,c=this._cachedMeta.rScale,d=c.xCenter,u=c.yCenter,p=c.getIndexAngle(0)-.5*Oe,f=p,g,m=360/this.countVisibleElements();for(g=0;g<n;++g)f+=this._computeAngle(g,o,m);for(g=n;g<n+s;g++){let h=e[g],b=f,x=f+this._computeAngle(g,o,m),v=i.getDataVisibility(g)?c.getDistanceFromCenterForValue(this.getParsed(g).r):0;f=x,r&&(l.animateScale&&(v=0),l.animateRotate&&(b=x=p));let w={x:d,y:u,innerRadius:0,outerRadius:v,startAngle:b,endAngle:x,options:this.resolveDataElementOptions(g,h.active?"active":o)};this.updateElement(h,g,w,o)}}countVisibleElements(){let e=this._cachedMeta,n=0;return e.data.forEach((s,o)=>{!isNaN(this.getParsed(o).r)&&this.chart.getDataVisibility(o)&&n++}),n}_computeAngle(e,n,s){return this.chart.getDataVisibility(e)?pn(this.resolveDataElementOptions(e,n).angle||s):0}},dp=class extends _i{static id="pie";static defaults={cutout:0,rotation:0,circumference:360,radius:"100%"}},up=class extends Wn{static id="radar";static defaults={datasetElementType:"line",dataElementType:"point",indexAxis:"r",showLine:!0,elements:{line:{fill:"start"}}};static overrides={aspectRatio:1,scales:{r:{type:"radialLinear"}}};getLabelAndValue(e){let n=this._cachedMeta.vScale,s=this.getParsed(e);return{label:n.getLabels()[e],value:""+n.getLabelForValue(s[n.axis])}}parseObjectData(e,n,s,o){return Hu.bind(this)(e,n,s,o)}update(e){let n=this._cachedMeta,s=n.dataset,o=n.data||[],r=n.iScale.getLabels();if(s.points=o,e!=="resize"){let i=this.resolveDatasetElementOptions(e);this.options.showLine||(i.borderWidth=0);let a={_loop:!0,_fullLoop:r.length===o.length,options:i};this.updateElement(s,void 0,a,e)}this.updateElements(o,0,o.length,e)}updateElements(e,n,s,o){let r=this._cachedMeta.rScale,i=o==="reset";for(let a=n;a<n+s;a++){let l=e[a],c=this.resolveDataElementOptions(a,l.active?"active":o),d=r.getPointPositionForValue(a,this.getParsed(a).r),u=i?r.xCenter:d.x,p=i?r.yCenter:d.y,f={x:u,y:p,angle:d.angle,skip:isNaN(u)||isNaN(p),options:c};this.updateElement(l,a,f,o)}}},pp=class extends Wn{static id="scatter";static defaults={datasetElementType:!1,dataElementType:"point",showLine:!1,fill:!1};static overrides={interaction:{mode:"point"},scales:{x:{type:"linear"},y:{type:"linear"}}};getLabelAndValue(e){let n=this._cachedMeta,s=this.chart.data.labels||[],{xScale:o,yScale:r}=n,i=this.getParsed(e),a=o.getLabelForValue(i.x),l=r.getLabelForValue(i.y);return{label:s[e]||"",value:"("+a+", "+l+")"}}update(e){let n=this._cachedMeta,{data:s=[]}=n,o=this.chart._animationsDisabled,{start:r,count:i}=Pu(n,s,o);if(this._drawStart=r,this._drawCount=i,Ru(n)&&(r=0,i=s.length),this.options.showLine){this.datasetElementType||this.addElements();let{dataset:a,_dataset:l}=n;a._chart=this.chart,a._datasetIndex=this.index,a._decimated=!!l._decimated,a.points=s;let c=this.resolveDatasetElementOptions(e);c.segment=this.options.segment,this.updateElement(a,void 0,{animated:!o,options:c},e)}else this.datasetElementType&&(delete n.dataset,this.datasetElementType=!1);this.updateElements(s,r,i,e)}addElements(){let{showLine:e}=this.options;!this.datasetElementType&&e&&(this.datasetElementType=this.chart.registry.getElement("line")),super.addElements()}updateElements(e,n,s,o){let r=o==="reset",{iScale:i,vScale:a,_stacked:l,_dataset:c}=this._cachedMeta,d=this.resolveDataElementOptions(n,o),u=this.getSharedOptions(d),p=this.includeOptions(o,u),f=i.axis,g=a.axis,{spanGaps:m,segment:h}=this.options,b=io(m)?m:Number.POSITIVE_INFINITY,x=this.chart._animationsDisabled||r||o==="none",v=n>0&&this.getParsed(n-1);for(let w=n;w<n+s;++w){let $=e[w],S=this.getParsed(w),C=x?$:{},_=_e(S[g]),k=C[f]=i.getPixelForValue(S[f],w),A=C[g]=r||_?a.getBasePixel():a.getPixelForValue(l?this.applyStack(a,S,l):S[g],w);C.skip=isNaN(k)||isNaN(A)||_,C.stop=w>0&&Math.abs(S[f]-v[f])>b,h&&(C.parsed=S,C.raw=c.data[w]),p&&(C.options=u||this.resolveDataElementOptions(w,$.active?"active":o)),x||this.updateElement($,w,C,o),v=S}this.updateSharedOptions(u,o,d)}getMaxOverflow(){let e=this._cachedMeta,n=e.data||[];if(!this.options.showLine){let a=0;for(let l=n.length-1;l>=0;--l)a=Math.max(a,n[l].size(this.resolveDataElementOptions(l))/2);return a>0&&a}let s=e.dataset,o=s.options&&s.options.borderWidth||0;if(!n.length)return o;let r=n[0].size(this.resolveDataElementOptions(0)),i=n[n.length-1].size(this.resolveDataElementOptions(n.length-1));return Math.max(o,r,i)/2}},X5=Object.freeze({__proto__:null,BarController:ap,BubbleController:lp,DoughnutController:_i,LineController:cp,PieController:dp,PolarAreaController:Yl,RadarController:up,ScatterController:pp});function lo(){throw new Error("This method is not implemented: Check that a complete date adapter is provided.")}var fp=class t{static override(e){Object.assign(t.prototype,e)}options;constructor(e){this.options=e||{}}init(){}formats(){return lo()}parse(){return lo()}format(){return lo()}add(){return lo()}diff(){return lo()}startOf(){return lo()}endOf(){return lo()}},Q5={_date:fp};function eM(t,e,n,s){let{controller:o,data:r,_sorted:i}=t,a=o._cachedMeta.iScale,l=t.dataset&&t.dataset.options?t.dataset.options.spanGaps:null;if(a&&e===a.axis&&e!=="r"&&i&&r.length){let c=a._reversePixels?_v:Dn;if(s){if(o._sharedOptions){let d=r[0],u=typeof d.getRange=="function"&&d.getRange(e);if(u){let p=c(r,e,n-u),f=c(r,e,n+u);return{lo:p.lo,hi:f.hi}}}}else{let d=c(r,e,n);if(l){let{vScale:u}=o._cachedMeta,{_parsed:p}=t,f=p.slice(0,d.lo+1).reverse().findIndex(m=>!_e(m[u.axis]));d.lo-=Math.max(0,f);let g=p.slice(d.hi).findIndex(m=>!_e(m[u.axis]));d.hi+=Math.max(0,g)}return d}}return{lo:0,hi:r.length-1}}function Ri(t,e,n,s,o){let r=t.getSortedVisibleDatasetMetas(),i=n[e];for(let a=0,l=r.length;a<l;++a){let{index:c,data:d}=r[a],{lo:u,hi:p}=eM(r[a],e,i,o);for(let f=u;f<=p;++f){let g=d[f];g.skip||s(g,c,f)}}}function tM(t){let e=t.indexOf("x")!==-1,n=t.indexOf("y")!==-1;return function(s,o){let r=e?Math.abs(s.x-o.x):0,i=n?Math.abs(s.y-o.y):0;return Math.sqrt(Math.pow(r,2)+Math.pow(i,2))}}function Xu(t,e,n,s,o){let r=[];return!o&&!t.isPointInArea(e)||Ri(t,n,e,function(a,l,c){!o&&!Nn(a,t.chartArea,0)||a.inRange(e.x,e.y,s)&&r.push({element:a,datasetIndex:l,index:c})},!0),r}function nM(t,e,n,s){let o=[];function r(i,a,l){let{startAngle:c,endAngle:d}=i.getProps(["startAngle","endAngle"],s),{angle:u}=Cu(i,{x:e.x,y:e.y});lr(u,c,d)&&o.push({element:i,datasetIndex:a,index:l})}return Ri(t,n,e,r),o}function sM(t,e,n,s,o,r){let i=[],a=tM(n),l=Number.POSITIVE_INFINITY;function c(d,u,p){let f=d.inRange(e.x,e.y,o);if(s&&!f)return;let g=d.getCenterPoint(o);if(!(!!r||t.isPointInArea(g))&&!f)return;let h=a(e,g);h<l?(i=[{element:d,datasetIndex:u,index:p}],l=h):h===l&&i.push({element:d,datasetIndex:u,index:p})}return Ri(t,n,e,c),i}function Qu(t,e,n,s,o,r){return!r&&!t.isPointInArea(e)?[]:n==="r"&&!s?nM(t,e,n,o):sM(t,e,n,s,o,r)}function s$(t,e,n,s,o){let r=[],i=n==="x"?"inXRange":"inYRange",a=!1;return Ri(t,n,e,(l,c,d)=>{l[i]&&l[i](e[n],o)&&(r.push({element:l,datasetIndex:c,index:d}),a=a||l.inRange(e.x,e.y,o))}),s&&!a?[]:r}var oM={evaluateInteractionItems:Ri,modes:{index(t,e,n,s){let o=Rs(e,t),r=n.axis||"x",i=n.includeInvisible||!1,a=n.intersect?Xu(t,o,r,s,i):Qu(t,o,r,!1,s,i),l=[];return a.length?(t.getSortedVisibleDatasetMetas().forEach(c=>{let d=a[0].index,u=c.data[d];u&&!u.skip&&l.push({element:u,datasetIndex:c.index,index:d})}),l):[]},dataset(t,e,n,s){let o=Rs(e,t),r=n.axis||"xy",i=n.includeInvisible||!1,a=n.intersect?Xu(t,o,r,s,i):Qu(t,o,r,!1,s,i);if(a.length>0){let l=a[0].datasetIndex,c=t.getDatasetMeta(l).data;a=[];for(let d=0;d<c.length;++d)a.push({element:c[d],datasetIndex:l,index:d})}return a},point(t,e,n,s){let o=Rs(e,t),r=n.axis||"xy",i=n.includeInvisible||!1;return Xu(t,o,r,s,i)},nearest(t,e,n,s){let o=Rs(e,t),r=n.axis||"xy",i=n.includeInvisible||!1;return Qu(t,o,r,n.intersect,s,i)},x(t,e,n,s){let o=Rs(e,t);return s$(t,o,"x",n.intersect,s)},y(t,e,n,s){let o=Rs(e,t);return s$(t,o,"y",n.intersect,s)}}},J$=["left","top","right","bottom"];function vi(t,e){return t.filter(n=>n.pos===e)}function o$(t,e){return t.filter(n=>J$.indexOf(n.pos)===-1&&n.box.axis===e)}function $i(t,e){return t.sort((n,s)=>{let o=e?s:n,r=e?n:s;return o.weight===r.weight?o.index-r.index:o.weight-r.weight})}function rM(t){let e=[],n,s,o,r,i,a;for(n=0,s=(t||[]).length;n<s;++n)o=t[n],{position:r,options:{stack:i,stackWeight:a=1}}=o,e.push({index:n,box:o,pos:r,horizontal:o.isHorizontal(),weight:o.weight,stack:i&&r+i,stackWeight:a});return e}function iM(t){let e={};for(let n of t){let{stack:s,pos:o,stackWeight:r}=n;if(!s||!J$.includes(o))continue;let i=e[s]||(e[s]={count:0,placed:0,weight:0,size:0});i.count++,i.weight+=r}return e}function aM(t,e){let n=iM(t),{vBoxMaxWidth:s,hBoxMaxHeight:o}=e,r,i,a;for(r=0,i=t.length;r<i;++r){a=t[r];let{fullSize:l}=a.box,c=n[a.stack],d=c&&a.stackWeight/c.weight;a.horizontal?(a.width=d?d*s:l&&e.availableWidth,a.height=o):(a.width=s,a.height=d?d*o:l&&e.availableHeight)}return n}function lM(t){let e=rM(t),n=$i(e.filter(c=>c.box.fullSize),!0),s=$i(vi(e,"left"),!0),o=$i(vi(e,"right")),r=$i(vi(e,"top"),!0),i=$i(vi(e,"bottom")),a=o$(e,"x"),l=o$(e,"y");return{fullSize:n,leftAndTop:s.concat(r),rightAndBottom:o.concat(l).concat(i).concat(a),chartArea:vi(e,"chartArea"),vertical:s.concat(o).concat(l),horizontal:r.concat(i).concat(a)}}function r$(t,e,n,s){return Math.max(t[n],e[n])+Math.max(t[s],e[s])}function Z$(t,e){t.top=Math.max(t.top,e.top),t.left=Math.max(t.left,e.left),t.bottom=Math.max(t.bottom,e.bottom),t.right=Math.max(t.right,e.right)}function cM(t,e,n,s){let{pos:o,box:r}=n,i=t.maxPadding;if(!Ae(o)){n.size&&(t[o]-=n.size);let u=s[n.stack]||{size:0,count:1};u.size=Math.max(u.size,n.horizontal?r.height:r.width),n.size=u.size/u.count,t[o]+=n.size}r.getPadding&&Z$(i,r.getPadding());let a=Math.max(0,e.outerWidth-r$(i,t,"left","right")),l=Math.max(0,e.outerHeight-r$(i,t,"top","bottom")),c=a!==t.w,d=l!==t.h;return t.w=a,t.h=l,n.horizontal?{same:c,other:d}:{same:d,other:c}}function dM(t){let e=t.maxPadding;function n(s){let o=Math.max(e[s]-t[s],0);return t[s]+=o,o}t.y+=n("top"),t.x+=n("left"),n("right"),n("bottom")}function uM(t,e){let n=e.maxPadding;function s(o){let r={left:0,top:0,right:0,bottom:0};return o.forEach(i=>{r[i]=Math.max(e[i],n[i])}),r}return s(t?["left","right"]:["top","bottom"])}function Si(t,e,n,s){let o=[],r,i,a,l,c,d;for(r=0,i=t.length,c=0;r<i;++r){a=t[r],l=a.box,l.update(a.width||e.w,a.height||e.h,uM(a.horizontal,e));let{same:u,other:p}=cM(e,n,a,s);c|=u&&o.length,d=d||p,l.fullSize||o.push(a)}return c&&Si(o,e,n,s)||d}function Vl(t,e,n,s,o){t.top=n,t.left=e,t.right=e+s,t.bottom=n+o,t.width=s,t.height=o}function i$(t,e,n,s){let o=n.padding,{x:r,y:i}=e;for(let a of t){let l=a.box,c=s[a.stack]||{count:1,placed:0,weight:1},d=a.stackWeight/c.weight||1;if(a.horizontal){let u=e.w*d,p=c.size||l.height;ir(c.start)&&(i=c.start),l.fullSize?Vl(l,o.left,i,n.outerWidth-o.right-o.left,p):Vl(l,e.left+c.placed,i,u,p),c.start=i,c.placed+=u,i=l.bottom}else{let u=e.h*d,p=c.size||l.width;ir(c.start)&&(r=c.start),l.fullSize?Vl(l,r,o.top,p,n.outerHeight-o.bottom-o.top):Vl(l,r,e.top+c.placed,p,u),c.start=r,c.placed+=u,r=l.right}}e.x=r,e.y=i}var Ft={addBox(t,e){t.boxes||(t.boxes=[]),e.fullSize=e.fullSize||!1,e.position=e.position||"top",e.weight=e.weight||0,e._layers=e._layers||function(){return[{z:0,draw(n){e.draw(n)}}]},t.boxes.push(e)},removeBox(t,e){let n=t.boxes?t.boxes.indexOf(e):-1;n!==-1&&t.boxes.splice(n,1)},configure(t,e,n){e.fullSize=n.fullSize,e.position=n.position,e.weight=n.weight},update(t,e,n,s){if(!t)return;let o=Dt(t.options.layout.padding),r=Math.max(e-o.width,0),i=Math.max(n-o.height,0),a=lM(t.boxes),l=a.vertical,c=a.horizontal;ze(t.boxes,m=>{typeof m.beforeLayout=="function"&&m.beforeLayout()});let d=l.reduce((m,h)=>h.box.options&&h.box.options.display===!1?m:m+1,0)||1,u=Object.freeze({outerWidth:e,outerHeight:n,padding:o,availableWidth:r,availableHeight:i,vBoxMaxWidth:r/2/d,hBoxMaxHeight:i/2}),p=Object.assign({},o);Z$(p,Dt(s));let f=Object.assign({maxPadding:p,w:r,h:i,x:o.left,y:o.top},o),g=aM(l.concat(c),u);Si(a.fullSize,f,u,g),Si(l,f,u,g),Si(c,f,u,g)&&Si(l,f,u,g),dM(f),i$(a.leftAndTop,f,u,g),f.x+=f.w,f.y+=f.h,i$(a.rightAndBottom,f,u,g),t.chartArea={left:f.left,top:f.top,right:f.left+f.w,bottom:f.top+f.h,height:f.h,width:f.w},ze(a.chartArea,m=>{let h=m.box;Object.assign(h,t.chartArea),h.update(f.w,f.h,{left:0,top:0,right:0,bottom:0})})}},Xl=class{acquireContext(e,n){}releaseContext(e){return!1}addEventListener(e,n,s){}removeEventListener(e,n,s){}getDevicePixelRatio(){return 1}getMaximumSize(e,n,s,o){return n=Math.max(0,n||e.width),s=s||e.height,{width:n,height:Math.max(0,o?Math.floor(n/o):s)}}isAttached(e){return!0}updateConfig(e){}},hp=class extends Xl{acquireContext(e){return e&&e.getContext&&e.getContext("2d")||null}updateConfig(e){e.options.animation=!1}},ql="$chartjs",pM={touchstart:"mousedown",touchmove:"mousemove",touchend:"mouseup",pointerenter:"mouseenter",pointerdown:"mousedown",pointermove:"mousemove",pointerup:"mouseup",pointerleave:"mouseout",pointerout:"mouseout"},a$=t=>t===null||t==="";function fM(t,e){let n=t.style,s=t.getAttribute("height"),o=t.getAttribute("width");if(t[ql]={initial:{height:s,width:o,style:{display:n.display,height:n.height,width:n.width}}},n.display=n.display||"block",n.boxSizing=n.boxSizing||"border-box",a$(o)){let r=Vu(t,"width");r!==void 0&&(t.width=r)}if(a$(s))if(t.style.height==="")t.height=t.width/(e||2);else{let r=Vu(t,"height");r!==void 0&&(t.height=r)}return t}var Y$=jv?{passive:!0}:!1;function hM(t,e,n){t&&t.addEventListener(e,n,Y$)}function mM(t,e,n){t&&t.canvas&&t.canvas.removeEventListener(e,n,Y$)}function gM(t,e){let n=pM[t.type]||t.type,{x:s,y:o}=Rs(t,e);return{type:n,chart:e,native:t,x:s!==void 0?s:null,y:o!==void 0?o:null}}function Ql(t,e){for(let n of t)if(n===e||n.contains(e))return!0}function bM(t,e,n){let s=t.canvas,o=new MutationObserver(r=>{let i=!1;for(let a of r)i=i||Ql(a.addedNodes,s),i=i&&!Ql(a.removedNodes,s);i&&n()});return o.observe(document,{childList:!0,subtree:!0}),o}function xM(t,e,n){let s=t.canvas,o=new MutationObserver(r=>{let i=!1;for(let a of r)i=i||Ql(a.removedNodes,s),i=i&&!Ql(a.addedNodes,s);i&&n()});return o.observe(document,{childList:!0,subtree:!0}),o}var Mi=new Map,l$=0;function X$(){let t=window.devicePixelRatio;t!==l$&&(l$=t,Mi.forEach((e,n)=>{n.currentDevicePixelRatio!==t&&e()}))}function yM(t,e){Mi.size||window.addEventListener("resize",X$),Mi.set(t,e)}function vM(t){Mi.delete(t),Mi.size||window.removeEventListener("resize",X$)}function $M(t,e,n){let s=t.canvas,o=s&&Hl(s);if(!o)return;let r=Tu((a,l)=>{let c=o.clientWidth;n(a,l),c<o.clientWidth&&n()},window),i=new ResizeObserver(a=>{let l=a[0],c=l.contentRect.width,d=l.contentRect.height;c===0&&d===0||r(c,d)});return i.observe(o),yM(t,r),i}function ep(t,e,n){n&&n.disconnect(),e==="resize"&&vM(t)}function wM(t,e,n){let s=t.canvas,o=Tu(r=>{t.ctx!==null&&n(gM(r,t))},t);return hM(s,e,o),o}var mp=class extends Xl{acquireContext(e,n){let s=e&&e.getContext&&e.getContext("2d");return s&&s.canvas===e?(fM(e,n),s):null}releaseContext(e){let n=e.canvas;if(!n[ql])return!1;let s=n[ql].initial;["height","width"].forEach(r=>{let i=s[r];_e(i)?n.removeAttribute(r):n.setAttribute(r,i)});let o=s.style||{};return Object.keys(o).forEach(r=>{n.style[r]=o[r]}),n.width=n.width,delete n[ql],!0}addEventListener(e,n,s){this.removeEventListener(e,n);let o=e.$proxies||(e.$proxies={}),i={attach:bM,detach:xM,resize:$M}[n]||wM;o[n]=i(e,n,s)}removeEventListener(e,n){let s=e.$proxies||(e.$proxies={}),o=s[n];if(!o)return;({attach:ep,detach:ep,resize:ep}[n]||mM)(e,n,o),s[n]=void 0}getDevicePixelRatio(){return window.devicePixelRatio}getMaximumSize(e,n,s,o){return Vv(e,n,s,o)}isAttached(e){let n=e&&Hl(e);return!!(n&&n.isConnected)}};function kM(t){return!Fl()||typeof OffscreenCanvas<"u"&&t instanceof OffscreenCanvas?hp:mp}var kn=class{static defaults={};static defaultRoutes=void 0;x;y;active=!1;options;$animations;tooltipPosition(e){let{x:n,y:s}=this.getProps(["x","y"],e);return{x:n,y:s}}hasValue(){return io(this.x)&&io(this.y)}getProps(e,n){let s=this.$animations;if(!n||!s)return this;let o={};return e.forEach(r=>{o[r]=s[r]&&s[r].active()?s[r]._to:this[r]}),o}};function SM(t,e){let n=t.options.ticks,s=CM(t),o=Math.min(n.maxTicksLimit||s,s),r=n.major.enabled?MM(e):[],i=r.length,a=r[0],l=r[i-1],c=[];if(i>o)return AM(e,c,r,i/o),c;let d=_M(r,e,o);if(i>0){let u,p,f=i>1?Math.round((l-a)/(i-1)):null;for(jl(e,c,d,_e(f)?0:a-f,a),u=0,p=i-1;u<p;u++)jl(e,c,d,r[u],r[u+1]);return jl(e,c,d,l,_e(f)?e.length:l+f),c}return jl(e,c,d),c}function CM(t){let e=t.options.offset,n=t._tickSize(),s=t._length/n+(e?0:1),o=t._maxLength/n;return Math.floor(Math.min(s,o))}function _M(t,e,n){let s=TM(t),o=e.length/n;if(!s)return Math.max(o,1);let r=kv(s);for(let i=0,a=r.length-1;i<a;i++){let l=r[i];if(l>o)return l}return Math.max(o,1)}function MM(t){let e=[],n,s;for(n=0,s=t.length;n<s;n++)t[n].major&&e.push(n);return e}function AM(t,e,n,s){let o=0,r=n[0],i;for(s=Math.ceil(s),i=0;i<t.length;i++)i===r&&(e.push(t[i]),o++,r=n[o*s])}function jl(t,e,n,s,o){let r=$e(s,0),i=Math.min($e(o,t.length),t.length),a=0,l,c,d;for(n=Math.ceil(n),o&&(l=o-s,n=l/Math.floor(l/n)),d=r;d<0;)a++,d=Math.round(r+a*n);for(c=Math.max(r,0);c<i;c++)c===d&&(e.push(t[c]),a++,d=Math.round(r+a*n))}function TM(t){let e=t.length,n,s;if(e<2)return!1;for(s=t[0],n=1;n<e;++n)if(t[n]-t[n-1]!==s)return!1;return s}var PM=t=>t==="left"?"right":t==="right"?"left":t,c$=(t,e,n)=>e==="top"||e==="left"?t[e]+n:t[e]-n,d$=(t,e)=>Math.min(e||t,t);function u$(t,e){let n=[],s=t.length/e,o=t.length,r=0;for(;r<o;r+=s)n.push(t[Math.floor(r)]);return n}function RM(t,e,n){let s=t.ticks.length,o=Math.min(e,s-1),r=t._startPixel,i=t._endPixel,a=1e-6,l=t.getPixelForTick(o),c;if(!(n&&(s===1?c=Math.max(l-r,i-l):e===0?c=(t.getPixelForTick(1)-l)/2:c=(l-t.getPixelForTick(o-1))/2,l+=o<e?c:-c,l<r-a||l>i+a)))return l}function LM(t,e){ze(t,n=>{let s=n.gc,o=s.length/2,r;if(o>e){for(r=0;r<o;++r)delete n.data[s[r]];s.splice(0,o)}})}function wi(t){return t.drawTicks?t.tickLength:0}function p$(t,e){if(!t.display)return 0;let n=ht(t.font,e),s=Dt(t.padding);return(Ze(t.text)?t.text.length:1)*n.lineHeight+s.height}function EM(t,e){return rs(t,{scale:e,type:"scale"})}function IM(t,e,n){return rs(t,{tick:n,index:e,type:"tick"})}function DM(t,e,n){let s=Il(t);return(n&&e!=="right"||!n&&e==="right")&&(s=PM(s)),s}function NM(t,e,n,s){let{top:o,left:r,bottom:i,right:a,chart:l}=t,{chartArea:c,scales:d}=l,u=0,p,f,g,m=i-o,h=a-r;if(t.isHorizontal()){if(f=It(s,r,a),Ae(n)){let b=Object.keys(n)[0],x=n[b];g=d[b].getPixelForValue(x)+m-e}else n==="center"?g=(c.bottom+c.top)/2+m-e:g=c$(t,n,e);p=a-r}else{if(Ae(n)){let b=Object.keys(n)[0],x=n[b];f=d[b].getPixelForValue(x)-h+e}else n==="center"?f=(c.left+c.right)/2-h+e:f=c$(t,n,e);g=It(s,i,o),u=n==="left"?-dt:dt}return{titleX:f,titleY:g,maxWidth:p,rotation:u}}var uo=class t extends kn{constructor(e){super(),this.id=e.id,this.type=e.type,this.options=void 0,this.ctx=e.ctx,this.chart=e.chart,this.top=void 0,this.bottom=void 0,this.left=void 0,this.right=void 0,this.width=void 0,this.height=void 0,this._margins={left:0,right:0,top:0,bottom:0},this.maxWidth=void 0,this.maxHeight=void 0,this.paddingTop=void 0,this.paddingBottom=void 0,this.paddingLeft=void 0,this.paddingRight=void 0,this.axis=void 0,this.labelRotation=void 0,this.min=void 0,this.max=void 0,this._range=void 0,this.ticks=[],this._gridLineItems=null,this._labelItems=null,this._labelSizes=null,this._length=0,this._maxLength=0,this._longestTextCache={},this._startPixel=void 0,this._endPixel=void 0,this._reversePixels=!1,this._userMax=void 0,this._userMin=void 0,this._suggestedMax=void 0,this._suggestedMin=void 0,this._ticksLength=0,this._borderValue=0,this._cache={},this._dataLimitsCached=!1,this.$context=void 0}init(e){this.options=e.setContext(this.getContext()),this.axis=e.axis,this._userMin=this.parse(e.min),this._userMax=this.parse(e.max),this._suggestedMin=this.parse(e.suggestedMin),this._suggestedMax=this.parse(e.suggestedMax)}parse(e,n){return e}getUserBounds(){let{_userMin:e,_userMax:n,_suggestedMin:s,_suggestedMax:o}=this;return e=Zt(e,Number.POSITIVE_INFINITY),n=Zt(n,Number.NEGATIVE_INFINITY),s=Zt(s,Number.POSITIVE_INFINITY),o=Zt(o,Number.NEGATIVE_INFINITY),{min:Zt(e,s),max:Zt(n,o),minDefined:at(e),maxDefined:at(n)}}getMinMax(e){let{min:n,max:s,minDefined:o,maxDefined:r}=this.getUserBounds(),i;if(o&&r)return{min:n,max:s};let a=this.getMatchingVisibleMetas();for(let l=0,c=a.length;l<c;++l)i=a[l].controller.getMinMax(this,e),o||(n=Math.min(n,i.min)),r||(s=Math.max(s,i.max));return n=r&&n>s?s:n,s=o&&n>s?n:s,{min:Zt(n,Zt(s,n)),max:Zt(s,Zt(n,s))}}getPadding(){return{left:this.paddingLeft||0,top:this.paddingTop||0,right:this.paddingRight||0,bottom:this.paddingBottom||0}}getTicks(){return this.ticks}getLabels(){let e=this.chart.data;return this.options.labels||(this.isHorizontal()?e.xLabels:e.yLabels)||e.labels||[]}getLabelItems(e=this.chart.chartArea){return this._labelItems||(this._labelItems=this._computeLabelItems(e))}beforeLayout(){this._cache={},this._dataLimitsCached=!1}beforeUpdate(){qe(this.options.beforeUpdate,[this])}update(e,n,s){let{beginAtZero:o,grace:r,ticks:i}=this.options,a=i.sampleSize;this.beforeUpdate(),this.maxWidth=e,this.maxHeight=n,this._margins=s=Object.assign({left:0,right:0,top:0,bottom:0},s),this.ticks=null,this._labelSizes=null,this._gridLineItems=null,this._labelItems=null,this.beforeSetDimensions(),this.setDimensions(),this.afterSetDimensions(),this._maxLength=this.isHorizontal()?this.width+s.left+s.right:this.height+s.top+s.bottom,this._dataLimitsCached||(this.beforeDataLimits(),this.determineDataLimits(),this.afterDataLimits(),this._range=Nv(this,r,o),this._dataLimitsCached=!0),this.beforeBuildTicks(),this.ticks=this.buildTicks()||[],this.afterBuildTicks();let l=a<this.ticks.length;this._convertTicksToLabels(l?u$(this.ticks,a):this.ticks),this.configure(),this.beforeCalculateLabelRotation(),this.calculateLabelRotation(),this.afterCalculateLabelRotation(),i.display&&(i.autoSkip||i.source==="auto")&&(this.ticks=SM(this,this.ticks),this._labelSizes=null,this.afterAutoSkip()),l&&this._convertTicksToLabels(this.ticks),this.beforeFit(),this.fit(),this.afterFit(),this.afterUpdate()}configure(){let e=this.options.reverse,n,s;this.isHorizontal()?(n=this.left,s=this.right):(n=this.top,s=this.bottom,e=!e),this._startPixel=n,this._endPixel=s,this._reversePixels=e,this._length=s-n,this._alignToPixels=this.options.alignToPixels}afterUpdate(){qe(this.options.afterUpdate,[this])}beforeSetDimensions(){qe(this.options.beforeSetDimensions,[this])}setDimensions(){this.isHorizontal()?(this.width=this.maxWidth,this.left=0,this.right=this.width):(this.height=this.maxHeight,this.top=0,this.bottom=this.height),this.paddingLeft=0,this.paddingTop=0,this.paddingRight=0,this.paddingBottom=0}afterSetDimensions(){qe(this.options.afterSetDimensions,[this])}_callHooks(e){this.chart.notifyPlugins(e,this.getContext()),qe(this.options[e],[this])}beforeDataLimits(){this._callHooks("beforeDataLimits")}determineDataLimits(){}afterDataLimits(){this._callHooks("afterDataLimits")}beforeBuildTicks(){this._callHooks("beforeBuildTicks")}buildTicks(){return[]}afterBuildTicks(){this._callHooks("afterBuildTicks")}beforeTickToLabelConversion(){qe(this.options.beforeTickToLabelConversion,[this])}generateTickLabels(e){let n=this.options.ticks,s,o,r;for(s=0,o=e.length;s<o;s++)r=e[s],r.label=qe(n.callback,[r.value,s,e],this)}afterTickToLabelConversion(){qe(this.options.afterTickToLabelConversion,[this])}beforeCalculateLabelRotation(){qe(this.options.beforeCalculateLabelRotation,[this])}calculateLabelRotation(){let e=this.options,n=e.ticks,s=d$(this.ticks.length,e.ticks.maxTicksLimit),o=n.minRotation||0,r=n.maxRotation,i=o,a,l,c;if(!this._isVisible()||!n.display||o>=r||s<=1||!this.isHorizontal()){this.labelRotation=o;return}let d=this._getLabelSizes(),u=d.widest.width,p=d.highest.height,f=vt(this.chart.width-u,0,this.maxWidth);a=e.offset?this.maxWidth/s:f/(s-1),u+6>a&&(a=f/(s-(e.offset?.5:1)),l=this.maxHeight-wi(e.grid)-n.padding-p$(e.title,this.chart.options.font),c=Math.sqrt(u*u+p*p),i=Ll(Math.min(Math.asin(vt((d.highest.height+6)/a,-1,1)),Math.asin(vt(l/c,-1,1))-Math.asin(vt(p/c,-1,1)))),i=Math.max(o,Math.min(r,i))),this.labelRotation=i}afterCalculateLabelRotation(){qe(this.options.afterCalculateLabelRotation,[this])}afterAutoSkip(){}beforeFit(){qe(this.options.beforeFit,[this])}fit(){let e={width:0,height:0},{chart:n,options:{ticks:s,title:o,grid:r}}=this,i=this._isVisible(),a=this.isHorizontal();if(i){let l=p$(o,n.options.font);if(a?(e.width=this.maxWidth,e.height=wi(r)+l):(e.height=this.maxHeight,e.width=wi(r)+l),s.display&&this.ticks.length){let{first:c,last:d,widest:u,highest:p}=this._getLabelSizes(),f=s.padding*2,g=pn(this.labelRotation),m=Math.cos(g),h=Math.sin(g);if(a){let b=s.mirror?0:h*u.width+m*p.height;e.height=Math.min(this.maxHeight,e.height+b+f)}else{let b=s.mirror?0:m*u.width+h*p.height;e.width=Math.min(this.maxWidth,e.width+b+f)}this._calculatePadding(c,d,h,m)}}this._handleMargins(),a?(this.width=this._length=n.width-this._margins.left-this._margins.right,this.height=e.height):(this.width=e.width,this.height=this._length=n.height-this._margins.top-this._margins.bottom)}_calculatePadding(e,n,s,o){let{ticks:{align:r,padding:i},position:a}=this.options,l=this.labelRotation!==0,c=a!=="top"&&this.axis==="x";if(this.isHorizontal()){let d=this.getPixelForTick(0)-this.left,u=this.right-this.getPixelForTick(this.ticks.length-1),p=0,f=0;l?c?(p=o*e.width,f=s*n.height):(p=s*e.height,f=o*n.width):r==="start"?f=n.width:r==="end"?p=e.width:r!=="inner"&&(p=e.width/2,f=n.width/2),this.paddingLeft=Math.max((p-d+i)*this.width/(this.width-d),0),this.paddingRight=Math.max((f-u+i)*this.width/(this.width-u),0)}else{let d=n.height/2,u=e.height/2;r==="start"?(d=0,u=e.height):r==="end"&&(d=n.height,u=0),this.paddingTop=d+i,this.paddingBottom=u+i}}_handleMargins(){this._margins&&(this._margins.left=Math.max(this.paddingLeft,this._margins.left),this._margins.top=Math.max(this.paddingTop,this._margins.top),this._margins.right=Math.max(this.paddingRight,this._margins.right),this._margins.bottom=Math.max(this.paddingBottom,this._margins.bottom))}afterFit(){qe(this.options.afterFit,[this])}isHorizontal(){let{axis:e,position:n}=this.options;return n==="top"||n==="bottom"||e==="x"}isFullSize(){return this.options.fullSize}_convertTicksToLabels(e){this.beforeTickToLabelConversion(),this.generateTickLabels(e);let n,s;for(n=0,s=e.length;n<s;n++)_e(e[n].label)&&(e.splice(n,1),s--,n--);this.afterTickToLabelConversion()}_getLabelSizes(){let e=this._labelSizes;if(!e){let n=this.options.ticks.sampleSize,s=this.ticks;n<s.length&&(s=u$(s,n)),this._labelSizes=e=this._computeLabelSizes(s,s.length,this.options.ticks.maxTicksLimit)}return e}_computeLabelSizes(e,n,s){let{ctx:o,_longestTextCache:r}=this,i=[],a=[],l=Math.floor(n/d$(n,s)),c=0,d=0,u,p,f,g,m,h,b,x,v,w,$;for(u=0;u<n;u+=l){if(g=e[u].label,m=this._resolveTickFontOptions(u),o.font=h=m.string,b=r[h]=r[h]||{data:{},gc:[]},x=m.lineHeight,v=w=0,!_e(g)&&!Ze(g))v=hi(o,b.data,b.gc,v,g),w=x;else if(Ze(g))for(p=0,f=g.length;p<f;++p)$=g[p],!_e($)&&!Ze($)&&(v=hi(o,b.data,b.gc,v,$),w+=x);i.push(v),a.push(w),c=Math.max(v,c),d=Math.max(w,d)}LM(r,n);let S=i.indexOf(c),C=a.indexOf(d),_=k=>({width:i[k]||0,height:a[k]||0});return{first:_(0),last:_(n-1),widest:_(S),highest:_(C),widths:i,heights:a}}getLabelForValue(e){return e}getPixelForValue(e,n){return NaN}getValueForPixel(e){}getPixelForTick(e){let n=this.ticks;return e<0||e>n.length-1?null:this.getPixelForValue(n[e].value)}getPixelForDecimal(e){this._reversePixels&&(e=1-e);let n=this._startPixel+e*this._length;return Cv(this._alignToPixels?As(this.chart,n,0):n)}getDecimalForPixel(e){let n=(e-this._startPixel)/this._length;return this._reversePixels?1-n:n}getBasePixel(){return this.getPixelForValue(this.getBaseValue())}getBaseValue(){let{min:e,max:n}=this;return e<0&&n<0?n:e>0&&n>0?e:0}getContext(e){let n=this.ticks||[];if(e>=0&&e<n.length){let s=n[e];return s.$context||(s.$context=IM(this.getContext(),e,s))}return this.$context||(this.$context=EM(this.chart.getContext(),this))}_tickSize(){let e=this.options.ticks,n=pn(this.labelRotation),s=Math.abs(Math.cos(n)),o=Math.abs(Math.sin(n)),r=this._getLabelSizes(),i=e.autoSkipPadding||0,a=r?r.widest.width+i:0,l=r?r.highest.height+i:0;return this.isHorizontal()?l*s>a*o?a/s:l/o:l*o<a*s?l/s:a/o}_isVisible(){let e=this.options.display;return e!=="auto"?!!e:this.getMatchingVisibleMetas().length>0}_computeGridLineItems(e){let n=this.axis,s=this.chart,o=this.options,{grid:r,position:i,border:a}=o,l=r.offset,c=this.isHorizontal(),u=this.ticks.length+(l?1:0),p=wi(r),f=[],g=a.setContext(this.getContext()),m=g.display?g.width:0,h=m/2,b=function(R){return As(s,R,m)},x,v,w,$,S,C,_,k,A,O,D,z;if(i==="top")x=b(this.bottom),C=this.bottom-p,k=x-h,O=b(e.top)+h,z=e.bottom;else if(i==="bottom")x=b(this.top),O=e.top,z=b(e.bottom)-h,C=x+h,k=this.top+p;else if(i==="left")x=b(this.right),S=this.right-p,_=x-h,A=b(e.left)+h,D=e.right;else if(i==="right")x=b(this.left),A=e.left,D=b(e.right)-h,S=x+h,_=this.left+p;else if(n==="x"){if(i==="center")x=b((e.top+e.bottom)/2+.5);else if(Ae(i)){let R=Object.keys(i)[0],B=i[R];x=b(this.chart.scales[R].getPixelForValue(B))}O=e.top,z=e.bottom,C=x+h,k=C+p}else if(n==="y"){if(i==="center")x=b((e.left+e.right)/2);else if(Ae(i)){let R=Object.keys(i)[0],B=i[R];x=b(this.chart.scales[R].getPixelForValue(B))}S=x-h,_=S-p,A=e.left,D=e.right}let E=$e(o.ticks.maxTicksLimit,u),M=Math.max(1,Math.ceil(u/E));for(v=0;v<u;v+=M){let R=this.getContext(v),B=r.setContext(R),I=a.setContext(R),U=B.lineWidth,W=B.color,G=I.dash||[],se=I.dashOffset,K=B.tickWidth,j=B.tickColor,X=B.tickBorderDash||[],de=B.tickBorderDashOffset;w=RM(this,v,l),w!==void 0&&($=As(s,w,U),c?S=_=A=D=$:C=k=O=z=$,f.push({tx1:S,ty1:C,tx2:_,ty2:k,x1:A,y1:O,x2:D,y2:z,width:U,color:W,borderDash:G,borderDashOffset:se,tickWidth:K,tickColor:j,tickBorderDash:X,tickBorderDashOffset:de}))}return this._ticksLength=u,this._borderValue=x,f}_computeLabelItems(e){let n=this.axis,s=this.options,{position:o,ticks:r}=s,i=this.isHorizontal(),a=this.ticks,{align:l,crossAlign:c,padding:d,mirror:u}=r,p=wi(s.grid),f=p+d,g=u?-d:f,m=-pn(this.labelRotation),h=[],b,x,v,w,$,S,C,_,k,A,O,D,z="middle";if(o==="top")S=this.bottom-g,C=this._getXAxisLabelAlignment();else if(o==="bottom")S=this.top+g,C=this._getXAxisLabelAlignment();else if(o==="left"){let M=this._getYAxisLabelAlignment(p);C=M.textAlign,$=M.x}else if(o==="right"){let M=this._getYAxisLabelAlignment(p);C=M.textAlign,$=M.x}else if(n==="x"){if(o==="center")S=(e.top+e.bottom)/2+f;else if(Ae(o)){let M=Object.keys(o)[0],R=o[M];S=this.chart.scales[M].getPixelForValue(R)+f}C=this._getXAxisLabelAlignment()}else if(n==="y"){if(o==="center")$=(e.left+e.right)/2-f;else if(Ae(o)){let M=Object.keys(o)[0],R=o[M];$=this.chart.scales[M].getPixelForValue(R)}C=this._getYAxisLabelAlignment(p).textAlign}n==="y"&&(l==="start"?z="top":l==="end"&&(z="bottom"));let E=this._getLabelSizes();for(b=0,x=a.length;b<x;++b){v=a[b],w=v.label;let M=r.setContext(this.getContext(b));_=this.getPixelForTick(b)+r.labelOffset,k=this._resolveTickFontOptions(b),A=k.lineHeight,O=Ze(w)?w.length:1;let R=O/2,B=M.color,I=M.textStrokeColor,U=M.textStrokeWidth,W=C;i?($=_,C==="inner"&&(b===x-1?W=this.options.reverse?"left":"right":b===0?W=this.options.reverse?"right":"left":W="center"),o==="top"?c==="near"||m!==0?D=-O*A+A/2:c==="center"?D=-E.highest.height/2-R*A+A:D=-E.highest.height+A/2:c==="near"||m!==0?D=A/2:c==="center"?D=E.highest.height/2-R*A:D=E.highest.height-O*A,u&&(D*=-1),m!==0&&!M.showLabelBackdrop&&($+=A/2*Math.sin(m))):(S=_,D=(1-O)*A/2);let G;if(M.showLabelBackdrop){let se=Dt(M.backdropPadding),K=E.heights[b],j=E.widths[b],X=D-se.top,de=0-se.left;switch(z){case"middle":X-=K/2;break;case"bottom":X-=K;break}switch(C){case"center":de-=j/2;break;case"right":de-=j;break;case"inner":b===x-1?de-=j:b>0&&(de-=j/2);break}G={left:de,top:X,width:j+se.width,height:K+se.height,color:M.backdropColor}}h.push({label:w,font:k,textOffset:D,options:{rotation:m,color:B,strokeColor:I,strokeWidth:U,textAlign:W,textBaseline:z,translation:[$,S],backdrop:G}})}return h}_getXAxisLabelAlignment(){let{position:e,ticks:n}=this.options;if(-pn(this.labelRotation))return e==="top"?"left":"right";let o="center";return n.align==="start"?o="left":n.align==="end"?o="right":n.align==="inner"&&(o="inner"),o}_getYAxisLabelAlignment(e){let{position:n,ticks:{crossAlign:s,mirror:o,padding:r}}=this.options,i=this._getLabelSizes(),a=e+r,l=i.widest.width,c,d;return n==="left"?o?(d=this.right+r,s==="near"?c="left":s==="center"?(c="center",d+=l/2):(c="right",d+=l)):(d=this.right-a,s==="near"?c="right":s==="center"?(c="center",d-=l/2):(c="left",d=this.left)):n==="right"?o?(d=this.left+r,s==="near"?c="right":s==="center"?(c="center",d-=l/2):(c="left",d-=l)):(d=this.left+a,s==="near"?c="left":s==="center"?(c="center",d+=l/2):(c="right",d=this.right)):c="right",{textAlign:c,x:d}}_computeLabelArea(){if(this.options.ticks.mirror)return;let e=this.chart,n=this.options.position;if(n==="left"||n==="right")return{top:0,left:this.left,bottom:e.height,right:this.right};if(n==="top"||n==="bottom")return{top:this.top,left:0,bottom:this.bottom,right:e.width}}drawBackground(){let{ctx:e,options:{backgroundColor:n},left:s,top:o,width:r,height:i}=this;n&&(e.save(),e.fillStyle=n,e.fillRect(s,o,r,i),e.restore())}getLineWidthForValue(e){let n=this.options.grid;if(!this._isVisible()||!n.display)return 0;let o=this.ticks.findIndex(r=>r.value===e);return o>=0?n.setContext(this.getContext(o)).lineWidth:0}drawGrid(e){let n=this.options.grid,s=this.ctx,o=this._gridLineItems||(this._gridLineItems=this._computeGridLineItems(e)),r,i,a=(l,c,d)=>{!d.width||!d.color||(s.save(),s.lineWidth=d.width,s.strokeStyle=d.color,s.setLineDash(d.borderDash||[]),s.lineDashOffset=d.borderDashOffset,s.beginPath(),s.moveTo(l.x,l.y),s.lineTo(c.x,c.y),s.stroke(),s.restore())};if(n.display)for(r=0,i=o.length;r<i;++r){let l=o[r];n.drawOnChartArea&&a({x:l.x1,y:l.y1},{x:l.x2,y:l.y2},l),n.drawTicks&&a({x:l.tx1,y:l.ty1},{x:l.tx2,y:l.ty2},{color:l.tickColor,width:l.tickWidth,borderDash:l.tickBorderDash,borderDashOffset:l.tickBorderDashOffset})}}drawBorder(){let{chart:e,ctx:n,options:{border:s,grid:o}}=this,r=s.setContext(this.getContext()),i=s.display?r.width:0;if(!i)return;let a=o.setContext(this.getContext(0)).lineWidth,l=this._borderValue,c,d,u,p;this.isHorizontal()?(c=As(e,this.left,i)-i/2,d=As(e,this.right,a)+a/2,u=p=l):(u=As(e,this.top,i)-i/2,p=As(e,this.bottom,a)+a/2,c=d=l),n.save(),n.lineWidth=r.width,n.strokeStyle=r.color,n.beginPath(),n.moveTo(c,u),n.lineTo(d,p),n.stroke(),n.restore()}drawLabels(e){if(!this.options.ticks.display)return;let s=this.ctx,o=this._computeLabelArea();o&&bi(s,o);let r=this.getLabelItems(e);for(let i of r){let a=i.options,l=i.font,c=i.label,d=i.textOffset;Ts(s,c,0,d,l,a)}o&&xi(s)}drawTitle(){let{ctx:e,options:{position:n,title:s,reverse:o}}=this;if(!s.display)return;let r=ht(s.font),i=Dt(s.padding),a=s.align,l=r.lineHeight/2;n==="bottom"||n==="center"||Ae(n)?(l+=i.bottom,Ze(s.text)&&(l+=r.lineHeight*(s.text.length-1))):l+=i.top;let{titleX:c,titleY:d,maxWidth:u,rotation:p}=NM(this,l,n,a);Ts(e,s.text,0,0,r,{color:s.color,maxWidth:u,rotation:p,textAlign:DM(a,n,o),textBaseline:"middle",translation:[c,d]})}draw(e){this._isVisible()&&(this.drawBackground(),this.drawGrid(e),this.drawBorder(),this.drawTitle(),this.drawLabels(e))}_layers(){let e=this.options,n=e.ticks&&e.ticks.z||0,s=$e(e.grid&&e.grid.z,-1),o=$e(e.border&&e.border.z,0);return!this._isVisible()||this.draw!==t.prototype.draw?[{z:n,draw:r=>{this.draw(r)}}]:[{z:s,draw:r=>{this.drawBackground(),this.drawGrid(r),this.drawTitle()}},{z:o,draw:()=>{this.drawBorder()}},{z:n,draw:r=>{this.drawLabels(r)}}]}getMatchingVisibleMetas(e){let n=this.chart.getSortedVisibleDatasetMetas(),s=this.axis+"AxisID",o=[],r,i;for(r=0,i=n.length;r<i;++r){let a=n[r];a[s]===this.id&&(!e||a.type===e)&&o.push(a)}return o}_resolveTickFontOptions(e){let n=this.options.ticks.setContext(this.getContext(e));return ht(n.font)}_maxDigits(){let e=this._resolveTickFontOptions(0).lineHeight;return(this.isHorizontal()?this.width:this.height)/e}},fr=class{constructor(e,n,s){this.type=e,this.scope=n,this.override=s,this.items=Object.create(null)}isForType(e){return Object.prototype.isPrototypeOf.call(this.type.prototype,e.prototype)}register(e){let n=Object.getPrototypeOf(e),s;FM(n)&&(s=this.register(n));let o=this.items,r=e.id,i=this.scope+"."+r;if(!r)throw new Error("class does not have id: "+e);return r in o||(o[r]=e,OM(e,i,s),this.override&&Qe.override(e.id,e.overrides)),i}get(e){return this.items[e]}unregister(e){let n=this.items,s=e.id,o=this.scope;s in n&&delete n[s],o&&s in Qe[o]&&(delete Qe[o][s],this.override&&delete Ms[s])}};function OM(t,e,n){let s=sr(Object.create(null),[n?Qe.get(n):{},Qe.get(e),t.defaults]);Qe.set(e,s),t.defaultRoutes&&BM(e,t.defaultRoutes),t.descriptors&&Qe.describe(e,t.descriptors)}function BM(t,e){Object.keys(e).forEach(n=>{let s=n.split("."),o=s.pop(),r=[t].concat(s).join("."),i=e[n].split("."),a=i.pop(),l=i.join(".");Qe.route(r,o,l,a)})}function FM(t){return"id"in t&&"defaults"in t}var gp=class{constructor(){this.controllers=new fr(Wn,"datasets",!0),this.elements=new fr(kn,"elements"),this.plugins=new fr(Object,"plugins"),this.scales=new fr(uo,"scales"),this._typedRegistries=[this.controllers,this.scales,this.elements]}add(...e){this._each("register",e)}remove(...e){this._each("unregister",e)}addControllers(...e){this._each("register",e,this.controllers)}addElements(...e){this._each("register",e,this.elements)}addPlugins(...e){this._each("register",e,this.plugins)}addScales(...e){this._each("register",e,this.scales)}getController(e){return this._get(e,this.controllers,"controller")}getElement(e){return this._get(e,this.elements,"element")}getPlugin(e){return this._get(e,this.plugins,"plugin")}getScale(e){return this._get(e,this.scales,"scale")}removeControllers(...e){this._each("unregister",e,this.controllers)}removeElements(...e){this._each("unregister",e,this.elements)}removePlugins(...e){this._each("unregister",e,this.plugins)}removeScales(...e){this._each("unregister",e,this.scales)}_each(e,n,s){[...n].forEach(o=>{let r=s||this._getRegistryForType(o);s||r.isForType(o)||r===this.plugins&&o.id?this._exec(e,r,o):ze(o,i=>{let a=s||this._getRegistryForType(i);this._exec(e,a,i)})})}_exec(e,n,s){let o=Rl(e);qe(s["before"+o],[],s),n[e](s),qe(s["after"+o],[],s)}_getRegistryForType(e){for(let n=0;n<this._typedRegistries.length;n++){let s=this._typedRegistries[n];if(s.isForType(e))return s}return this.plugins}_get(e,n,s){let o=n.get(e);if(o===void 0)throw new Error('"'+e+'" is not a registered '+s+".");return o}},Hn=new gp,bp=class{constructor(){this._init=void 0}notify(e,n,s,o){if(n==="beforeInit"&&(this._init=this._createDescriptors(e,!0),this._notify(this._init,e,"install")),this._init===void 0)return;let r=o?this._descriptors(e).filter(o):this._descriptors(e),i=this._notify(r,e,n,s);return n==="afterDestroy"&&(this._notify(r,e,"stop"),this._notify(this._init,e,"uninstall"),this._init=void 0),i}_notify(e,n,s,o){o=o||{};for(let r of e){let i=r.plugin,a=i[s],l=[n,o,r.options];if(qe(a,l,i)===!1&&o.cancelable)return!1}return!0}invalidate(){_e(this._cache)||(this._oldCache=this._cache,this._cache=void 0)}_descriptors(e){if(this._cache)return this._cache;let n=this._cache=this._createDescriptors(e);return this._notifyStateChanges(e),n}_createDescriptors(e,n){let s=e&&e.config,o=$e(s.options&&s.options.plugins,{}),r=HM(s);return o===!1&&!n?[]:VM(e,r,o,n)}_notifyStateChanges(e){let n=this._oldCache||[],s=this._cache,o=(r,i)=>r.filter(a=>!i.some(l=>a.plugin.id===l.plugin.id));this._notify(o(n,s),e,"stop"),this._notify(o(s,n),e,"start")}};function HM(t){let e={},n=[],s=Object.keys(Hn.plugins.items);for(let r=0;r<s.length;r++)n.push(Hn.getPlugin(s[r]));let o=t.plugins||[];for(let r=0;r<o.length;r++){let i=o[r];n.indexOf(i)===-1&&(n.push(i),e[i.id]=!0)}return{plugins:n,localIds:e}}function WM(t,e){return!e&&t===!1?null:t===!0?{}:t}function VM(t,{plugins:e,localIds:n},s,o){let r=[],i=t.getContext();for(let a of e){let l=a.id,c=WM(s[l],o);c!==null&&r.push({plugin:a,options:jM(t.config,{plugin:a,local:n[l]},c,i)})}return r}function jM(t,{plugin:e,local:n},s,o){let r=t.pluginScopeKeys(e),i=t.getOptionScopes(s,r);return n&&e.defaults&&i.push(e.defaults),t.createResolver(i,o,[""],{scriptable:!1,indexable:!1,allKeys:!0})}function xp(t,e){let n=Qe.datasets[t]||{};return((e.datasets||{})[t]||{}).indexAxis||e.indexAxis||n.indexAxis||"x"}function zM(t,e){let n=t;return t==="_index_"?n=e:t==="_value_"&&(n=e==="x"?"y":"x"),n}function UM(t,e){return t===e?"_index_":"_value_"}function f$(t){if(t==="x"||t==="y"||t==="r")return t}function KM(t){if(t==="top"||t==="bottom")return"x";if(t==="left"||t==="right")return"y"}function yp(t,...e){if(f$(t))return t;for(let n of e){let s=n.axis||KM(n.position)||t.length>1&&f$(t[0].toLowerCase());if(s)return s}throw new Error(`Cannot determine type of '${t}' axis. Please provide 'axis' or 'position' option.`)}function h$(t,e,n){if(n[e+"AxisID"]===t)return{axis:e}}function GM(t,e){if(e.data&&e.data.datasets){let n=e.data.datasets.filter(s=>s.xAxisID===t||s.yAxisID===t);if(n.length)return h$(t,"x",n[0])||h$(t,"y",n[0])}return{}}function qM(t,e){let n=Ms[t.type]||{scales:{}},s=e.scales||{},o=xp(t.type,e),r=Object.create(null);return Object.keys(s).forEach(i=>{let a=s[i];if(!Ae(a))return console.error(`Invalid scale configuration for scale: ${i}`);if(a._proxy)return console.warn(`Ignoring resolver passed as options for scale: ${i}`);let l=yp(i,a,GM(i,t),Qe.scales[a.type]),c=UM(l,o),d=n.scales||{};r[i]=rr(Object.create(null),[{axis:l},a,d[l],d[c]])}),t.data.datasets.forEach(i=>{let a=i.type||t.type,l=i.indexAxis||xp(a,e),d=(Ms[a]||{}).scales||{};Object.keys(d).forEach(u=>{let p=zM(u,l),f=i[p+"AxisID"]||p;r[f]=r[f]||Object.create(null),rr(r[f],[{axis:p},s[f],d[u]])})}),Object.keys(r).forEach(i=>{let a=r[i];rr(a,[Qe.scales[a.type],Qe.scale])}),r}function Q$(t){let e=t.options||(t.options={});e.plugins=$e(e.plugins,{}),e.scales=qM(t,e)}function e0(t){return t=t||{},t.datasets=t.datasets||[],t.labels=t.labels||[],t}function JM(t){return t=t||{},t.data=e0(t.data),Q$(t),t}var m$=new Map,t0=new Set;function zl(t,e){let n=m$.get(t);return n||(n=e(),m$.set(t,n),t0.add(n)),n}var ki=(t,e,n)=>{let s=os(e,n);s!==void 0&&t.add(s)},vp=class{constructor(e){this._config=JM(e),this._scopeCache=new Map,this._resolverCache=new Map}get platform(){return this._config.platform}get type(){return this._config.type}set type(e){this._config.type=e}get data(){return this._config.data}set data(e){this._config.data=e0(e)}get options(){return this._config.options}set options(e){this._config.options=e}get plugins(){return this._config.plugins}update(){let e=this._config;this.clearCache(),Q$(e)}clearCache(){this._scopeCache.clear(),this._resolverCache.clear()}datasetScopeKeys(e){return zl(e,()=>[[`datasets.${e}`,""]])}datasetAnimationScopeKeys(e,n){return zl(`${e}.transition.${n}`,()=>[[`datasets.${e}.transitions.${n}`,`transitions.${n}`],[`datasets.${e}`,""]])}datasetElementScopeKeys(e,n){return zl(`${e}-${n}`,()=>[[`datasets.${e}.elements.${n}`,`datasets.${e}`,`elements.${n}`,""]])}pluginScopeKeys(e){let n=e.id,s=this.type;return zl(`${s}-plugin-${n}`,()=>[[`plugins.${n}`,...e.additionalOptionScopes||[]]])}_cachedScopes(e,n){let s=this._scopeCache,o=s.get(e);return(!o||n)&&(o=new Map,s.set(e,o)),o}getOptionScopes(e,n,s){let{options:o,type:r}=this,i=this._cachedScopes(e,s),a=i.get(n);if(a)return a;let l=new Set;n.forEach(d=>{e&&(l.add(e),d.forEach(u=>ki(l,e,u))),d.forEach(u=>ki(l,o,u)),d.forEach(u=>ki(l,Ms[r]||{},u)),d.forEach(u=>ki(l,Qe,u)),d.forEach(u=>ki(l,Dl,u))});let c=Array.from(l);return c.length===0&&c.push(Object.create(null)),t0.has(n)&&i.set(n,c),c}chartOptionScopes(){let{options:e,type:n}=this;return[e,Ms[n]||{},Qe.datasets[n]||{},{type:n},Qe,Dl]}resolveNamedOptions(e,n,s,o=[""]){let r={$shared:!0},{resolver:i,subPrefixes:a}=g$(this._resolverCache,e,o),l=i;if(YM(i,n)){r.$shared=!1,s=ns(s)?s():s;let c=this.createResolver(e,s,a);l=ro(i,s,c)}for(let c of n)r[c]=l[c];return r}createResolver(e,n,s=[""],o){let{resolver:r}=g$(this._resolverCache,e,s);return Ae(n)?ro(r,n,void 0,o):r}};function g$(t,e,n){let s=t.get(e);s||(s=new Map,t.set(e,s));let o=n.join(),r=s.get(o);return r||(r={resolver:Bl(e,n),subPrefixes:n.filter(a=>!a.toLowerCase().includes("hover"))},s.set(o,r)),r}var ZM=t=>Ae(t)&&Object.getOwnPropertyNames(t).some(e=>ns(t[e]));function YM(t,e){let{isScriptable:n,isIndexable:s}=Ou(t);for(let o of e){let r=n(o),i=s(o),a=(i||r)&&t[o];if(r&&(ns(a)||ZM(a))||i&&Ze(a))return!0}return!1}var XM="4.5.1",QM=["top","bottom","left","right","chartArea"];function b$(t,e){return t==="top"||t==="bottom"||QM.indexOf(t)===-1&&e==="x"}function x$(t,e){return function(n,s){return n[t]===s[t]?n[e]-s[e]:n[t]-s[t]}}function y$(t){let e=t.chart,n=e.options.animation;e.notifyPlugins("afterRender"),qe(n&&n.onComplete,[t],e)}function eA(t){let e=t.chart,n=e.options.animation;qe(n&&n.onProgress,[t],e)}function n0(t){return Fl()&&typeof t=="string"?t=document.getElementById(t):t&&t.length&&(t=t[0]),t&&t.canvas&&(t=t.canvas),t}var Jl={},v$=t=>{let e=n0(t);return Object.values(Jl).filter(n=>n.canvas===e).pop()};function tA(t,e,n){let s=Object.keys(t);for(let o of s){let r=+o;if(r>=e){let i=t[o];delete t[o],(n>0||r>e)&&(t[r+n]=i)}}}function nA(t,e,n,s){return!n||t.type==="mouseout"?null:s?e:t}var hr=class{static defaults=Qe;static instances=Jl;static overrides=Ms;static registry=Hn;static version=XM;static getChart=v$;static register(...e){Hn.add(...e),$$()}static unregister(...e){Hn.remove(...e),$$()}constructor(e,n){let s=this.config=new vp(n),o=n0(e),r=v$(o);if(r)throw new Error("Canvas is already in use. Chart with ID '"+r.id+"' must be destroyed before the canvas with ID '"+r.canvas.id+"' can be reused.");let i=s.createResolver(s.chartOptionScopes(),this.getContext());this.platform=new(s.platform||kM(o)),this.platform.updateConfig(s);let a=this.platform.acquireContext(o,i.aspectRatio),l=a&&a.canvas,c=l&&l.height,d=l&&l.width;if(this.id=yv(),this.ctx=a,this.canvas=l,this.width=d,this.height=c,this._options=i,this._aspectRatio=this.aspectRatio,this._layers=[],this._metasets=[],this._stacks=void 0,this.boxes=[],this.currentDevicePixelRatio=void 0,this.chartArea=void 0,this._active=[],this._lastEvent=void 0,this._listeners={},this._responsiveListeners=void 0,this._sortedMetasets=[],this.scales={},this._plugins=new bp,this.$proxies={},this._hiddenIndices={},this.attached=!1,this._animationsDisabled=void 0,this.$context=void 0,this._doResize=Pv(u=>this.update(u),i.resizeDelay||0),this._dataChanges=[],Jl[this.id]=this,!a||!l){console.error("Failed to create chart: can't acquire context from the given item");return}is.listen(this,"complete",y$),is.listen(this,"progress",eA),this._initialize(),this.attached&&this.update()}get aspectRatio(){let{options:{aspectRatio:e,maintainAspectRatio:n},width:s,height:o,_aspectRatio:r}=this;return _e(e)?n&&r?r:o?s/o:null:e}get data(){return this.config.data}set data(e){this.config.data=e}get options(){return this._options}set options(e){this.config.options=e}get registry(){return Hn}_initialize(){return this.notifyPlugins("beforeInit"),this.options.responsive?this.resize():Wu(this,this.options.devicePixelRatio),this.bindEvents(),this.notifyPlugins("afterInit"),this}clear(){return Iu(this.canvas,this.ctx),this}stop(){return is.stop(this),this}resize(e,n){is.running(this)?this._resizeBeforeDraw={width:e,height:n}:this._resize(e,n)}_resize(e,n){let s=this.options,o=this.canvas,r=s.maintainAspectRatio&&this.aspectRatio,i=this.platform.getMaximumSize(o,e,n,r),a=s.devicePixelRatio||this.platform.getDevicePixelRatio(),l=this.width?"resize":"attach";this.width=i.width,this.height=i.height,this._aspectRatio=this.aspectRatio,Wu(this,a,!0)&&(this.notifyPlugins("resize",{size:i}),qe(s.onResize,[this,i],this),this.attached&&this._doResize(l)&&this.render())}ensureScalesHaveIDs(){let n=this.options.scales||{};ze(n,(s,o)=>{s.id=o})}buildOrUpdateScales(){let e=this.options,n=e.scales,s=this.scales,o=Object.keys(s).reduce((i,a)=>(i[a]=!1,i),{}),r=[];n&&(r=r.concat(Object.keys(n).map(i=>{let a=n[i],l=yp(i,a),c=l==="r",d=l==="x";return{options:a,dposition:c?"chartArea":d?"bottom":"left",dtype:c?"radialLinear":d?"category":"linear"}}))),ze(r,i=>{let a=i.options,l=a.id,c=yp(l,a),d=$e(a.type,i.dtype);(a.position===void 0||b$(a.position,c)!==b$(i.dposition))&&(a.position=i.dposition),o[l]=!0;let u=null;if(l in s&&s[l].type===d)u=s[l];else{let p=Hn.getScale(d);u=new p({id:l,type:d,ctx:this.ctx,chart:this}),s[u.id]=u}u.init(a,e)}),ze(o,(i,a)=>{i||delete s[a]}),ze(s,i=>{Ft.configure(this,i,i.options),Ft.addBox(this,i)})}_updateMetasets(){let e=this._metasets,n=this.data.datasets.length,s=e.length;if(e.sort((o,r)=>o.index-r.index),s>n){for(let o=n;o<s;++o)this._destroyDatasetMeta(o);e.splice(n,s-n)}this._sortedMetasets=e.slice(0).sort(x$("order","index"))}_removeUnreferencedMetasets(){let{_metasets:e,data:{datasets:n}}=this;e.length>n.length&&delete this._stacks,e.forEach((s,o)=>{n.filter(r=>r===s._dataset).length===0&&this._destroyDatasetMeta(o)})}buildOrUpdateControllers(){let e=[],n=this.data.datasets,s,o;for(this._removeUnreferencedMetasets(),s=0,o=n.length;s<o;s++){let r=n[s],i=this.getDatasetMeta(s),a=r.type||this.config.type;if(i.type&&i.type!==a&&(this._destroyDatasetMeta(s),i=this.getDatasetMeta(s)),i.type=a,i.indexAxis=r.indexAxis||xp(a,this.options),i.order=r.order||0,i.index=s,i.label=""+r.label,i.visible=this.isDatasetVisible(s),i.controller)i.controller.updateIndex(s),i.controller.linkScales();else{let l=Hn.getController(a),{datasetElementType:c,dataElementType:d}=Qe.datasets[a];Object.assign(l,{dataElementType:Hn.getElement(d),datasetElementType:c&&Hn.getElement(c)}),i.controller=new l(this,s),e.push(i.controller)}}return this._updateMetasets(),e}_resetElements(){ze(this.data.datasets,(e,n)=>{this.getDatasetMeta(n).controller.reset()},this)}reset(){this._resetElements(),this.notifyPlugins("reset")}update(e){let n=this.config;n.update();let s=this._options=n.createResolver(n.chartOptionScopes(),this.getContext()),o=this._animationsDisabled=!s.animation;if(this._updateScales(),this._checkEventBindings(),this._updateHiddenIndices(),this._plugins.invalidate(),this.notifyPlugins("beforeUpdate",{mode:e,cancelable:!0})===!1)return;let r=this.buildOrUpdateControllers();this.notifyPlugins("beforeElementsUpdate");let i=0;for(let c=0,d=this.data.datasets.length;c<d;c++){let{controller:u}=this.getDatasetMeta(c),p=!o&&r.indexOf(u)===-1;u.buildOrUpdateElements(p),i=Math.max(+u.getMaxOverflow(),i)}i=this._minPadding=s.layout.autoPadding?i:0,this._updateLayout(i),o||ze(r,c=>{c.reset()}),this._updateDatasets(e),this.notifyPlugins("afterUpdate",{mode:e}),this._layers.sort(x$("z","_idx"));let{_active:a,_lastEvent:l}=this;l?this._eventHandler(l,!0):a.length&&this._updateHoverStyles(a,a,!0),this.render()}_updateScales(){ze(this.scales,e=>{Ft.removeBox(this,e)}),this.ensureScalesHaveIDs(),this.buildOrUpdateScales()}_checkEventBindings(){let e=this.options,n=new Set(Object.keys(this._listeners)),s=new Set(e.events);(!$u(n,s)||!!this._responsiveListeners!==e.responsive)&&(this.unbindEvents(),this.bindEvents())}_updateHiddenIndices(){let{_hiddenIndices:e}=this,n=this._getUniformDataChanges()||[];for(let{method:s,start:o,count:r}of n){let i=s==="_removeElements"?-r:r;tA(e,o,i)}}_getUniformDataChanges(){let e=this._dataChanges;if(!e||!e.length)return;this._dataChanges=[];let n=this.data.datasets.length,s=r=>new Set(e.filter(i=>i[0]===r).map((i,a)=>a+","+i.splice(1).join(","))),o=s(0);for(let r=1;r<n;r++)if(!$u(o,s(r)))return;return Array.from(o).map(r=>r.split(",")).map(r=>({method:r[1],start:+r[2],count:+r[3]}))}_updateLayout(e){if(this.notifyPlugins("beforeLayout",{cancelable:!0})===!1)return;Ft.update(this,this.width,this.height,e);let n=this.chartArea,s=n.width<=0||n.height<=0;this._layers=[],ze(this.boxes,o=>{s&&o.position==="chartArea"||(o.configure&&o.configure(),this._layers.push(...o._layers()))},this),this._layers.forEach((o,r)=>{o._idx=r}),this.notifyPlugins("afterLayout")}_updateDatasets(e){if(this.notifyPlugins("beforeDatasetsUpdate",{mode:e,cancelable:!0})!==!1){for(let n=0,s=this.data.datasets.length;n<s;++n)this.getDatasetMeta(n).controller.configure();for(let n=0,s=this.data.datasets.length;n<s;++n)this._updateDataset(n,ns(e)?e({datasetIndex:n}):e);this.notifyPlugins("afterDatasetsUpdate",{mode:e})}}_updateDataset(e,n){let s=this.getDatasetMeta(e),o={meta:s,index:e,mode:n,cancelable:!0};this.notifyPlugins("beforeDatasetUpdate",o)!==!1&&(s.controller._update(n),o.cancelable=!1,this.notifyPlugins("afterDatasetUpdate",o))}render(){this.notifyPlugins("beforeRender",{cancelable:!0})!==!1&&(is.has(this)?this.attached&&!is.running(this)&&is.start(this):(this.draw(),y$({chart:this})))}draw(){let e;if(this._resizeBeforeDraw){let{width:s,height:o}=this._resizeBeforeDraw;this._resizeBeforeDraw=null,this._resize(s,o)}if(this.clear(),this.width<=0||this.height<=0||this.notifyPlugins("beforeDraw",{cancelable:!0})===!1)return;let n=this._layers;for(e=0;e<n.length&&n[e].z<=0;++e)n[e].draw(this.chartArea);for(this._drawDatasets();e<n.length;++e)n[e].draw(this.chartArea);this.notifyPlugins("afterDraw")}_getSortedDatasetMetas(e){let n=this._sortedMetasets,s=[],o,r;for(o=0,r=n.length;o<r;++o){let i=n[o];(!e||i.visible)&&s.push(i)}return s}getSortedVisibleDatasetMetas(){return this._getSortedDatasetMetas(!0)}_drawDatasets(){if(this.notifyPlugins("beforeDatasetsDraw",{cancelable:!0})===!1)return;let e=this.getSortedVisibleDatasetMetas();for(let n=e.length-1;n>=0;--n)this._drawDataset(e[n]);this.notifyPlugins("afterDatasetsDraw")}_drawDataset(e){let n=this.ctx,s={meta:e,index:e.index,cancelable:!0},o=Gu(this,e);this.notifyPlugins("beforeDatasetDraw",s)!==!1&&(o&&bi(n,o),e.controller.draw(),o&&xi(n),s.cancelable=!1,this.notifyPlugins("afterDatasetDraw",s))}isPointInArea(e){return Nn(e,this.chartArea,this._minPadding)}getElementsAtEventForMode(e,n,s,o){let r=oM.modes[n];return typeof r=="function"?r(this,e,s,o):[]}getDatasetMeta(e){let n=this.data.datasets[e],s=this._metasets,o=s.filter(r=>r&&r._dataset===n).pop();return o||(o={type:null,data:[],dataset:null,controller:null,hidden:null,xAxisID:null,yAxisID:null,order:n&&n.order||0,index:e,_dataset:n,_parsed:[],_sorted:!1},s.push(o)),o}getContext(){return this.$context||(this.$context=rs(null,{chart:this,type:"chart"}))}getVisibleDatasetCount(){return this.getSortedVisibleDatasetMetas().length}isDatasetVisible(e){let n=this.data.datasets[e];if(!n)return!1;let s=this.getDatasetMeta(e);return typeof s.hidden=="boolean"?!s.hidden:!n.hidden}setDatasetVisibility(e,n){let s=this.getDatasetMeta(e);s.hidden=!n}toggleDataVisibility(e){this._hiddenIndices[e]=!this._hiddenIndices[e]}getDataVisibility(e){return!this._hiddenIndices[e]}_updateVisibility(e,n,s){let o=s?"show":"hide",r=this.getDatasetMeta(e),i=r.controller._resolveAnimations(void 0,o);ir(n)?(r.data[n].hidden=!s,this.update()):(this.setDatasetVisibility(e,s),i.update(r,{visible:s}),this.update(a=>a.datasetIndex===e?o:void 0))}hide(e,n){this._updateVisibility(e,n,!1)}show(e,n){this._updateVisibility(e,n,!0)}_destroyDatasetMeta(e){let n=this._metasets[e];n&&n.controller&&n.controller._destroy(),delete this._metasets[e]}_stop(){let e,n;for(this.stop(),is.remove(this),e=0,n=this.data.datasets.length;e<n;++e)this._destroyDatasetMeta(e)}destroy(){this.notifyPlugins("beforeDestroy");let{canvas:e,ctx:n}=this;this._stop(),this.config.clearCache(),e&&(this.unbindEvents(),Iu(e,n),this.platform.releaseContext(n),this.canvas=null,this.ctx=null),delete Jl[this.id],this.notifyPlugins("afterDestroy")}toBase64Image(...e){return this.canvas.toDataURL(...e)}bindEvents(){this.bindUserEvents(),this.options.responsive?this.bindResponsiveEvents():this.attached=!0}bindUserEvents(){let e=this._listeners,n=this.platform,s=(r,i)=>{n.addEventListener(this,r,i),e[r]=i},o=(r,i,a)=>{r.offsetX=i,r.offsetY=a,this._eventHandler(r)};ze(this.options.events,r=>s(r,o))}bindResponsiveEvents(){this._responsiveListeners||(this._responsiveListeners={});let e=this._responsiveListeners,n=this.platform,s=(l,c)=>{n.addEventListener(this,l,c),e[l]=c},o=(l,c)=>{e[l]&&(n.removeEventListener(this,l,c),delete e[l])},r=(l,c)=>{this.canvas&&this.resize(l,c)},i,a=()=>{o("attach",a),this.attached=!0,this.resize(),s("resize",r),s("detach",i)};i=()=>{this.attached=!1,o("resize",r),this._stop(),this._resize(0,0),s("attach",a)},n.isAttached(this.canvas)?a():i()}unbindEvents(){ze(this._listeners,(e,n)=>{this.platform.removeEventListener(this,n,e)}),this._listeners={},ze(this._responsiveListeners,(e,n)=>{this.platform.removeEventListener(this,n,e)}),this._responsiveListeners=void 0}updateHoverStyle(e,n,s){let o=s?"set":"remove",r,i,a,l;for(n==="dataset"&&(r=this.getDatasetMeta(e[0].datasetIndex),r.controller["_"+o+"DatasetHoverStyle"]()),a=0,l=e.length;a<l;++a){i=e[a];let c=i&&this.getDatasetMeta(i.datasetIndex).controller;c&&c[o+"HoverStyle"](i.element,i.datasetIndex,i.index)}}getActiveElements(){return this._active||[]}setActiveElements(e){let n=this._active||[],s=e.map(({datasetIndex:r,index:i})=>{let a=this.getDatasetMeta(r);if(!a)throw new Error("No dataset found at index "+r);return{datasetIndex:r,element:a.data[i],index:i}});!mi(s,n)&&(this._active=s,this._lastEvent=null,this._updateHoverStyles(s,n))}notifyPlugins(e,n,s){return this._plugins.notify(this,e,n,s)}isPluginEnabled(e){return this._plugins._cache.filter(n=>n.plugin.id===e).length===1}_updateHoverStyles(e,n,s){let o=this.options.hover,r=(l,c)=>l.filter(d=>!c.some(u=>d.datasetIndex===u.datasetIndex&&d.index===u.index)),i=r(n,e),a=s?e:r(e,n);i.length&&this.updateHoverStyle(i,o.mode,!1),a.length&&o.mode&&this.updateHoverStyle(a,o.mode,!0)}_eventHandler(e,n){let s={event:e,replay:n,cancelable:!0,inChartArea:this.isPointInArea(e)},o=i=>(i.options.events||this.options.events).includes(e.native.type);if(this.notifyPlugins("beforeEvent",s,o)===!1)return;let r=this._handleEvent(e,n,s.inChartArea);return s.cancelable=!1,this.notifyPlugins("afterEvent",s,o),(r||s.changed)&&this.render(),this}_handleEvent(e,n,s){let{_active:o=[],options:r}=this,i=n,a=this._getActiveElements(e,o,s,i),l=wv(e),c=nA(e,this._lastEvent,s,l);s&&(this._lastEvent=null,qe(r.onHover,[e,a,this],this),l&&qe(r.onClick,[e,a,this],this));let d=!mi(a,o);return(d||n)&&(this._active=a,this._updateHoverStyles(a,o,n)),this._lastEvent=c,d}_getActiveElements(e,n,s,o){if(e.type==="mouseout")return[];if(!s)return n;let r=this.options.hover;return this.getElementsAtEventForMode(e,r.mode,r,o)}};function $$(){return ze(hr.instances,t=>t._plugins.invalidate())}function sA(t,e,n){let{startAngle:s,x:o,y:r,outerRadius:i,innerRadius:a,options:l}=e,{borderWidth:c,borderJoinStyle:d}=l,u=Math.min(c/i,Et(s-n));if(t.beginPath(),t.arc(o,r,i-c/2,s+u/2,n-u/2),a>0){let p=Math.min(c/a,Et(s-n));t.arc(o,r,a+c/2,n-p/2,s+p/2,!0)}else{let p=Math.min(c/2,i*Et(s-n));if(d==="round")t.arc(o,r,p,n-Oe/2,s+Oe/2,!0);else if(d==="bevel"){let f=2*p*p,g=-f*Math.cos(n+Oe/2)+o,m=-f*Math.sin(n+Oe/2)+r,h=f*Math.cos(s+Oe/2)+o,b=f*Math.sin(s+Oe/2)+r;t.lineTo(g,m),t.lineTo(h,b)}}t.closePath(),t.moveTo(0,0),t.rect(0,0,t.canvas.width,t.canvas.height),t.clip("evenodd")}function oA(t,e,n){let{startAngle:s,pixelMargin:o,x:r,y:i,outerRadius:a,innerRadius:l}=e,c=o/a;t.beginPath(),t.arc(r,i,a,s-c,n+c),l>o?(c=o/l,t.arc(r,i,l,n+c,s-c,!0)):t.arc(r,i,o,n+dt,s-dt),t.closePath(),t.clip()}function rA(t){return Ol(t,["outerStart","outerEnd","innerStart","innerEnd"])}function iA(t,e,n,s){let o=rA(t.options.borderRadius),r=(n-e)/2,i=Math.min(r,s*e/2),a=l=>{let c=(n-Math.min(r,l))*s/2;return vt(l,0,Math.min(r,c))};return{outerStart:a(o.outerStart),outerEnd:a(o.outerEnd),innerStart:vt(o.innerStart,0,i),innerEnd:vt(o.innerEnd,0,i)}}function pr(t,e,n,s){return{x:n+t*Math.cos(e),y:s+t*Math.sin(e)}}function ec(t,e,n,s,o,r){let{x:i,y:a,startAngle:l,pixelMargin:c,innerRadius:d}=e,u=Math.max(e.outerRadius+s+n-c,0),p=d>0?d+s+n+c:0,f=0,g=o-l;if(s){let M=d>0?d-s:0,R=u>0?u-s:0,B=(M+R)/2,I=B!==0?g*B/(B+s):g;f=(g-I)/2}let m=Math.max(.001,g*u-n/Oe)/u,h=(g-m)/2,b=l+h+f,x=o-h-f,{outerStart:v,outerEnd:w,innerStart:$,innerEnd:S}=iA(e,p,u,x-b),C=u-v,_=u-w,k=b+v/C,A=x-w/_,O=p+$,D=p+S,z=b+$/O,E=x-S/D;if(t.beginPath(),r){let M=(k+A)/2;if(t.arc(i,a,u,k,M),t.arc(i,a,u,M,A),w>0){let U=pr(_,A,i,a);t.arc(U.x,U.y,w,A,x+dt)}let R=pr(D,x,i,a);if(t.lineTo(R.x,R.y),S>0){let U=pr(D,E,i,a);t.arc(U.x,U.y,S,x+dt,E+Math.PI)}let B=(x-S/p+(b+$/p))/2;if(t.arc(i,a,p,x-S/p,B,!0),t.arc(i,a,p,B,b+$/p,!0),$>0){let U=pr(O,z,i,a);t.arc(U.x,U.y,$,z+Math.PI,b-dt)}let I=pr(C,b,i,a);if(t.lineTo(I.x,I.y),v>0){let U=pr(C,k,i,a);t.arc(U.x,U.y,v,b-dt,k)}}else{t.moveTo(i,a);let M=Math.cos(k)*u+i,R=Math.sin(k)*u+a;t.lineTo(M,R);let B=Math.cos(A)*u+i,I=Math.sin(A)*u+a;t.lineTo(B,I)}t.closePath()}function aA(t,e,n,s,o){let{fullCircles:r,startAngle:i,circumference:a}=e,l=e.endAngle;if(r){ec(t,e,n,s,l,o);for(let c=0;c<r;++c)t.fill();isNaN(a)||(l=i+(a%Ye||Ye))}return ec(t,e,n,s,l,o),t.fill(),l}function lA(t,e,n,s,o){let{fullCircles:r,startAngle:i,circumference:a,options:l}=e,{borderWidth:c,borderJoinStyle:d,borderDash:u,borderDashOffset:p,borderRadius:f}=l,g=l.borderAlign==="inner";if(!c)return;t.setLineDash(u||[]),t.lineDashOffset=p,g?(t.lineWidth=c*2,t.lineJoin=d||"round"):(t.lineWidth=c,t.lineJoin=d||"bevel");let m=e.endAngle;if(r){ec(t,e,n,s,m,o);for(let h=0;h<r;++h)t.stroke();isNaN(a)||(m=i+(a%Ye||Ye))}g&&oA(t,e,m),l.selfJoin&&m-i>=Oe&&f===0&&d!=="miter"&&sA(t,e,m),r||(ec(t,e,n,s,m,o),t.stroke())}var $p=class extends kn{static id="arc";static defaults={borderAlign:"center",borderColor:"#fff",borderDash:[],borderDashOffset:0,borderJoinStyle:void 0,borderRadius:0,borderWidth:2,offset:0,spacing:0,angle:void 0,circular:!0,selfJoin:!1};static defaultRoutes={backgroundColor:"backgroundColor"};static descriptors={_scriptable:!0,_indexable:e=>e!=="borderDash"};circumference;endAngle;fullCircles;innerRadius;outerRadius;pixelMargin;startAngle;constructor(e){super(),this.options=void 0,this.circumference=void 0,this.startAngle=void 0,this.endAngle=void 0,this.innerRadius=void 0,this.outerRadius=void 0,this.pixelMargin=0,this.fullCircles=0,e&&Object.assign(this,e)}inRange(e,n,s){let o=this.getProps(["x","y"],s),{angle:r,distance:i}=Cu(o,{x:e,y:n}),{startAngle:a,endAngle:l,innerRadius:c,outerRadius:d,circumference:u}=this.getProps(["startAngle","endAngle","innerRadius","outerRadius","circumference"],s),p=(this.options.spacing+this.options.borderWidth)/2,f=$e(u,l-a),g=lr(r,a,l)&&a!==l,m=f>=Ye||g,h=Bn(i,c+p,d+p);return m&&h}getCenterPoint(e){let{x:n,y:s,startAngle:o,endAngle:r,innerRadius:i,outerRadius:a}=this.getProps(["x","y","startAngle","endAngle","innerRadius","outerRadius"],e),{offset:l,spacing:c}=this.options,d=(o+r)/2,u=(i+a+c+l)/2;return{x:n+Math.cos(d)*u,y:s+Math.sin(d)*u}}tooltipPosition(e){return this.getCenterPoint(e)}draw(e){let{options:n,circumference:s}=this,o=(n.offset||0)/4,r=(n.spacing||0)/2,i=n.circular;if(this.pixelMargin=n.borderAlign==="inner"?.33:0,this.fullCircles=s>Ye?Math.floor(s/Ye):0,s===0||this.innerRadius<0||this.outerRadius<0)return;e.save();let a=(this.startAngle+this.endAngle)/2;e.translate(Math.cos(a)*o,Math.sin(a)*o);let l=1-Math.sin(Math.min(Oe,s||0)),c=o*l;e.fillStyle=n.backgroundColor,e.strokeStyle=n.borderColor,aA(e,this,c,r,i),lA(e,this,c,r,i),e.restore()}};function s0(t,e,n=e){t.lineCap=$e(n.borderCapStyle,e.borderCapStyle),t.setLineDash($e(n.borderDash,e.borderDash)),t.lineDashOffset=$e(n.borderDashOffset,e.borderDashOffset),t.lineJoin=$e(n.borderJoinStyle,e.borderJoinStyle),t.lineWidth=$e(n.borderWidth,e.borderWidth),t.strokeStyle=$e(n.borderColor,e.borderColor)}function cA(t,e,n){t.lineTo(n.x,n.y)}function dA(t){return t.stepped?Iv:t.tension||t.cubicInterpolationMode==="monotone"?Dv:cA}function o0(t,e,n={}){let s=t.length,{start:o=0,end:r=s-1}=n,{start:i,end:a}=e,l=Math.max(o,i),c=Math.min(r,a),d=o<i&&r<i||o>a&&r>a;return{count:s,start:l,loop:e.loop,ilen:c<l&&!d?s+c-l:c-l}}function uA(t,e,n,s){let{points:o,options:r}=e,{count:i,start:a,loop:l,ilen:c}=o0(o,n,s),d=dA(r),{move:u=!0,reverse:p}=s||{},f,g,m;for(f=0;f<=c;++f)g=o[(a+(p?c-f:f))%i],!g.skip&&(u?(t.moveTo(g.x,g.y),u=!1):d(t,m,g,p,r.stepped),m=g);return l&&(g=o[(a+(p?c:0))%i],d(t,m,g,p,r.stepped)),!!l}function pA(t,e,n,s){let o=e.points,{count:r,start:i,ilen:a}=o0(o,n,s),{move:l=!0,reverse:c}=s||{},d=0,u=0,p,f,g,m,h,b,x=w=>(i+(c?a-w:w))%r,v=()=>{m!==h&&(t.lineTo(d,h),t.lineTo(d,m),t.lineTo(d,b))};for(l&&(f=o[x(0)],t.moveTo(f.x,f.y)),p=0;p<=a;++p){if(f=o[x(p)],f.skip)continue;let w=f.x,$=f.y,S=w|0;S===g?($<m?m=$:$>h&&(h=$),d=(u*d+w)/++u):(v(),t.lineTo(w,$),g=S,u=0,m=h=$),b=$}v()}function wp(t){let e=t.options,n=e.borderDash&&e.borderDash.length;return!t._decimated&&!t._loop&&!e.tension&&e.cubicInterpolationMode!=="monotone"&&!e.stepped&&!n?pA:uA}function fA(t){return t.stepped?zv:t.tension||t.cubicInterpolationMode==="monotone"?Uv:Cs}function hA(t,e,n,s){let o=e._path;o||(o=e._path=new Path2D,e.path(o,n,s)&&o.closePath()),s0(t,e.options),t.stroke(o)}function mA(t,e,n,s){let{segments:o,options:r}=e,i=wp(e);for(let a of o)s0(t,r,a.style),t.beginPath(),i(t,e,a,{start:n,end:n+s-1})&&t.closePath(),t.stroke()}var gA=typeof Path2D=="function";function bA(t,e,n,s){gA&&!e.options.segment?hA(t,e,n,s):mA(t,e,n,s)}var mr=class extends kn{static id="line";static defaults={borderCapStyle:"butt",borderDash:[],borderDashOffset:0,borderJoinStyle:"miter",borderWidth:3,capBezierPoints:!0,cubicInterpolationMode:"default",fill:!1,spanGaps:!1,stepped:!1,tension:0};static defaultRoutes={backgroundColor:"backgroundColor",borderColor:"borderColor"};static descriptors={_scriptable:!0,_indexable:e=>e!=="borderDash"&&e!=="fill"};constructor(e){super(),this.animated=!0,this.options=void 0,this._chart=void 0,this._loop=void 0,this._fullLoop=void 0,this._path=void 0,this._points=void 0,this._segments=void 0,this._decimated=!1,this._pointsUpdated=!1,this._datasetIndex=void 0,e&&Object.assign(this,e)}updateControlPoints(e,n){let s=this.options;if((s.tension||s.cubicInterpolationMode==="monotone")&&!s.stepped&&!this._pointsUpdated){let o=s.spanGaps?this._loop:this._fullLoop;Wv(this._points,s,e,o,n),this._pointsUpdated=!0}}set points(e){this._points=e,delete this._segments,delete this._path,this._pointsUpdated=!1}get points(){return this._points}get segments(){return this._segments||(this._segments=Gv(this,this.options.segment))}first(){let e=this.segments,n=this.points;return e.length&&n[e[0].start]}last(){let e=this.segments,n=this.points,s=e.length;return s&&n[e[s-1].end]}interpolate(e,n){let s=this.options,o=e[n],r=this.points,i=Ku(this,{property:n,start:o,end:o});if(!i.length)return;let a=[],l=fA(s),c,d;for(c=0,d=i.length;c<d;++c){let{start:u,end:p}=i[c],f=r[u],g=r[p];if(f===g){a.push(f);continue}let m=Math.abs((o-f[n])/(g[n]-f[n])),h=l(f,g,m,s.stepped);h[n]=e[n],a.push(h)}return a.length===1?a[0]:a}pathSegment(e,n,s){return wp(this)(e,this,n,s)}path(e,n,s){let o=this.segments,r=wp(this),i=this._loop;n=n||0,s=s||this.points.length-n;for(let a of o)i&=r(e,this,a,{start:n,end:n+s-1});return!!i}draw(e,n,s,o){let r=this.options||{};(this.points||[]).length&&r.borderWidth&&(e.save(),bA(e,this,s,o),e.restore()),this.animated&&(this._pointsUpdated=!1,this._path=void 0)}};function w$(t,e,n,s){let o=t.options,{[n]:r}=t.getProps([n],s);return Math.abs(e-r)<o.radius+o.hitRadius}var kp=class extends kn{static id="point";parsed;skip;stop;static defaults={borderWidth:1,hitRadius:1,hoverBorderWidth:1,hoverRadius:4,pointStyle:"circle",radius:3,rotation:0};static defaultRoutes={backgroundColor:"backgroundColor",borderColor:"borderColor"};constructor(e){super(),this.options=void 0,this.parsed=void 0,this.skip=void 0,this.stop=void 0,e&&Object.assign(this,e)}inRange(e,n,s){let o=this.options,{x:r,y:i}=this.getProps(["x","y"],s);return Math.pow(e-r,2)+Math.pow(n-i,2)<Math.pow(o.hitRadius+o.radius,2)}inXRange(e,n){return w$(this,e,"x",n)}inYRange(e,n){return w$(this,e,"y",n)}getCenterPoint(e){let{x:n,y:s}=this.getProps(["x","y"],e);return{x:n,y:s}}size(e){e=e||this.options||{};let n=e.radius||0;n=Math.max(n,n&&e.hoverRadius||0);let s=n&&e.borderWidth||0;return(n+s)*2}draw(e,n){let s=this.options;this.skip||s.radius<.1||!Nn(this,n,this.size(s)/2)||(e.strokeStyle=s.borderColor,e.lineWidth=s.borderWidth,e.fillStyle=s.backgroundColor,Nl(e,s,this.x,this.y))}getRange(){let e=this.options||{};return e.radius+e.hitRadius}};function r0(t,e){let{x:n,y:s,base:o,width:r,height:i}=t.getProps(["x","y","base","width","height"],e),a,l,c,d,u;return t.horizontal?(u=i/2,a=Math.min(n,o),l=Math.max(n,o),c=s-u,d=s+u):(u=r/2,a=n-u,l=n+u,c=Math.min(s,o),d=Math.max(s,o)),{left:a,top:c,right:l,bottom:d}}function Ls(t,e,n,s){return t?0:vt(e,n,s)}function xA(t,e,n){let s=t.options.borderWidth,o=t.borderSkipped,r=Nu(s);return{t:Ls(o.top,r.top,0,n),r:Ls(o.right,r.right,0,e),b:Ls(o.bottom,r.bottom,0,n),l:Ls(o.left,r.left,0,e)}}function yA(t,e,n){let{enableBorderRadius:s}=t.getProps(["enableBorderRadius"]),o=t.options.borderRadius,r=Ps(o),i=Math.min(e,n),a=t.borderSkipped,l=s||Ae(o);return{topLeft:Ls(!l||a.top||a.left,r.topLeft,0,i),topRight:Ls(!l||a.top||a.right,r.topRight,0,i),bottomLeft:Ls(!l||a.bottom||a.left,r.bottomLeft,0,i),bottomRight:Ls(!l||a.bottom||a.right,r.bottomRight,0,i)}}function vA(t){let e=r0(t),n=e.right-e.left,s=e.bottom-e.top,o=xA(t,n/2,s/2),r=yA(t,n/2,s/2);return{outer:{x:e.left,y:e.top,w:n,h:s,radius:r},inner:{x:e.left+o.l,y:e.top+o.t,w:n-o.l-o.r,h:s-o.t-o.b,radius:{topLeft:Math.max(0,r.topLeft-Math.max(o.t,o.l)),topRight:Math.max(0,r.topRight-Math.max(o.t,o.r)),bottomLeft:Math.max(0,r.bottomLeft-Math.max(o.b,o.l)),bottomRight:Math.max(0,r.bottomRight-Math.max(o.b,o.r))}}}}function tp(t,e,n,s){let o=e===null,r=n===null,a=t&&!(o&&r)&&r0(t,s);return a&&(o||Bn(e,a.left,a.right))&&(r||Bn(n,a.top,a.bottom))}function $A(t){return t.topLeft||t.topRight||t.bottomLeft||t.bottomRight}function wA(t,e){t.rect(e.x,e.y,e.w,e.h)}function np(t,e,n={}){let s=t.x!==n.x?-e:0,o=t.y!==n.y?-e:0,r=(t.x+t.w!==n.x+n.w?e:0)-s,i=(t.y+t.h!==n.y+n.h?e:0)-o;return{x:t.x+s,y:t.y+o,w:t.w+r,h:t.h+i,radius:t.radius}}var Sp=class extends kn{static id="bar";static defaults={borderSkipped:"start",borderWidth:0,borderRadius:0,inflateAmount:"auto",pointStyle:void 0};static defaultRoutes={backgroundColor:"backgroundColor",borderColor:"borderColor"};constructor(e){super(),this.options=void 0,this.horizontal=void 0,this.base=void 0,this.width=void 0,this.height=void 0,this.inflateAmount=void 0,e&&Object.assign(this,e)}draw(e){let{inflateAmount:n,options:{borderColor:s,backgroundColor:o}}=this,{inner:r,outer:i}=vA(this),a=$A(i.radius)?dr:wA;e.save(),(i.w!==r.w||i.h!==r.h)&&(e.beginPath(),a(e,np(i,n,r)),e.clip(),a(e,np(r,-n,i)),e.fillStyle=s,e.fill("evenodd")),e.beginPath(),a(e,np(r,n)),e.fillStyle=o,e.fill(),e.restore()}inRange(e,n,s){return tp(this,e,n,s)}inXRange(e,n){return tp(this,e,null,n)}inYRange(e,n){return tp(this,null,e,n)}getCenterPoint(e){let{x:n,y:s,base:o,horizontal:r}=this.getProps(["x","y","base","horizontal"],e);return{x:r?(n+o)/2:n,y:r?s:(s+o)/2}}getRange(e){return e==="x"?this.width/2:this.height/2}},kA=Object.freeze({__proto__:null,ArcElement:$p,BarElement:Sp,LineElement:mr,PointElement:kp}),Cp=["rgb(54, 162, 235)","rgb(255, 99, 132)","rgb(255, 159, 64)","rgb(255, 205, 86)","rgb(75, 192, 192)","rgb(153, 102, 255)","rgb(201, 203, 207)"],k$=Cp.map(t=>t.replace("rgb(","rgba(").replace(")",", 0.5)"));function i0(t){return Cp[t%Cp.length]}function a0(t){return k$[t%k$.length]}function SA(t,e){return t.borderColor=i0(e),t.backgroundColor=a0(e),++e}function CA(t,e){return t.backgroundColor=t.data.map(()=>i0(e++)),e}function _A(t,e){return t.backgroundColor=t.data.map(()=>a0(e++)),e}function MA(t){let e=0;return(n,s)=>{let o=t.getDatasetMeta(s).controller;o instanceof _i?e=CA(n,e):o instanceof Yl?e=_A(n,e):o&&(e=SA(n,e))}}function S$(t){let e;for(e in t)if(t[e].borderColor||t[e].backgroundColor)return!0;return!1}function AA(t){return t&&(t.borderColor||t.backgroundColor)}function TA(){return Qe.borderColor!=="rgba(0,0,0,0.1)"||Qe.backgroundColor!=="rgba(0,0,0,0.1)"}var PA={id:"colors",defaults:{enabled:!0,forceOverride:!1},beforeLayout(t,e,n){if(!n.enabled)return;let{data:{datasets:s},options:o}=t.config,{elements:r}=o,i=S$(s)||AA(o)||r&&S$(r)||TA();if(!n.forceOverride&&i)return;let a=MA(t);s.forEach(a)}};function RA(t,e,n,s,o){let r=o.samples||s;if(r>=n)return t.slice(e,e+n);let i=[],a=(n-2)/(r-2),l=0,c=e+n-1,d=e,u,p,f,g,m;for(i[l++]=t[d],u=0;u<r-2;u++){let h=0,b=0,x,v=Math.floor((u+1)*a)+1+e,w=Math.min(Math.floor((u+2)*a)+1,n)+e,$=w-v;for(x=v;x<w;x++)h+=t[x].x,b+=t[x].y;h/=$,b/=$;let S=Math.floor(u*a)+1+e,C=Math.min(Math.floor((u+1)*a)+1,n)+e,{x:_,y:k}=t[d];for(f=g=-1,x=S;x<C;x++)g=.5*Math.abs((_-h)*(t[x].y-k)-(_-t[x].x)*(b-k)),g>f&&(f=g,p=t[x],m=x);i[l++]=p,d=m}return i[l++]=t[c],i}function LA(t,e,n,s){let o=0,r=0,i,a,l,c,d,u,p,f,g,m,h=[],b=e+n-1,x=t[e].x,w=t[b].x-x;for(i=e;i<e+n;++i){a=t[i],l=(a.x-x)/w*s,c=a.y;let $=l|0;if($===d)c<g?(g=c,u=i):c>m&&(m=c,p=i),o=(r*o+a.x)/++r;else{let S=i-1;if(!_e(u)&&!_e(p)){let C=Math.min(u,p),_=Math.max(u,p);C!==f&&C!==S&&h.push({...t[C],x:o}),_!==f&&_!==S&&h.push({...t[_],x:o})}i>0&&S!==f&&h.push(t[S]),h.push(a),d=$,r=0,g=m=c,u=p=f=i}}return h}function l0(t){if(t._decimated){let e=t._data;delete t._decimated,delete t._data,Object.defineProperty(t,"data",{configurable:!0,enumerable:!0,writable:!0,value:e})}}function C$(t){t.data.datasets.forEach(e=>{l0(e)})}function EA(t,e){let n=e.length,s=0,o,{iScale:r}=t,{min:i,max:a,minDefined:l,maxDefined:c}=r.getUserBounds();return l&&(s=vt(Dn(e,r.axis,i).lo,0,n-1)),c?o=vt(Dn(e,r.axis,a).hi+1,s,n)-s:o=n-s,{start:s,count:o}}var IA={id:"decimation",defaults:{algorithm:"min-max",enabled:!1},beforeElementsUpdate:(t,e,n)=>{if(!n.enabled){C$(t);return}let s=t.width;t.data.datasets.forEach((o,r)=>{let{_data:i,indexAxis:a}=o,l=t.getDatasetMeta(r),c=i||o.data;if(ur([a,t.options.indexAxis])==="y"||!l.controller.supportsDecimation)return;let d=t.scales[l.xAxisID];if(d.type!=="linear"&&d.type!=="time"||t.options.parsing)return;let{start:u,count:p}=EA(l,c),f=n.threshold||4*s;if(p<=f){l0(o);return}_e(i)&&(o._data=c,delete o.data,Object.defineProperty(o,"data",{configurable:!0,enumerable:!0,get:function(){return this._decimated},set:function(m){this._data=m}}));let g;switch(n.algorithm){case"lttb":g=RA(c,u,p,s,n);break;case"min-max":g=LA(c,u,p,s);break;default:throw new Error(`Unsupported decimation algorithm '${n.algorithm}'`)}o._decimated=g})},destroy(t){C$(t)}};function DA(t,e,n){let s=t.segments,o=t.points,r=e.points,i=[];for(let a of s){let{start:l,end:c}=a;c=oc(l,c,o);let d=_p(n,o[l],o[c],a.loop);if(!e.segments){i.push({source:a,target:d,start:o[l],end:o[c]});continue}let u=Ku(e,d);for(let p of u){let f=_p(n,r[p.start],r[p.end],p.loop),g=Uu(a,o,f);for(let m of g)i.push({source:m,target:p,start:{[n]:_$(d,f,"start",Math.max)},end:{[n]:_$(d,f,"end",Math.min)}})}}return i}function _p(t,e,n,s){if(s)return;let o=e[t],r=n[t];return t==="angle"&&(o=Et(o),r=Et(r)),{property:t,start:o,end:r}}function NA(t,e){let{x:n=null,y:s=null}=t||{},o=e.points,r=[];return e.segments.forEach(({start:i,end:a})=>{a=oc(i,a,o);let l=o[i],c=o[a];s!==null?(r.push({x:l.x,y:s}),r.push({x:c.x,y:s})):n!==null&&(r.push({x:n,y:l.y}),r.push({x:n,y:c.y}))}),r}function oc(t,e,n){for(;e>t;e--){let s=n[e];if(!isNaN(s.x)&&!isNaN(s.y))break}return e}function _$(t,e,n,s){return t&&e?s(t[n],e[n]):t?t[n]:e?e[n]:0}function c0(t,e){let n=[],s=!1;return Ze(t)?(s=!0,n=t):n=NA(t,e),n.length?new mr({points:n,options:{tension:0},_loop:s,_fullLoop:s}):null}function M$(t){return t&&t.fill!==!1}function OA(t,e,n){let o=t[e].fill,r=[e],i;if(!n)return o;for(;o!==!1&&r.indexOf(o)===-1;){if(!at(o))return o;if(i=t[o],!i)return!1;if(i.visible)return o;r.push(o),o=i.fill}return!1}function BA(t,e,n){let s=VA(t);if(Ae(s))return isNaN(s.value)?!1:s;let o=parseFloat(s);return at(o)&&Math.floor(o)===o?FA(s[0],e,o,n):["origin","start","end","stack","shape"].indexOf(s)>=0&&s}function FA(t,e,n,s){return(t==="-"||t==="+")&&(n=e+n),n===e||n<0||n>=s?!1:n}function HA(t,e){let n=null;return t==="start"?n=e.bottom:t==="end"?n=e.top:Ae(t)?n=e.getPixelForValue(t.value):e.getBasePixel&&(n=e.getBasePixel()),n}function WA(t,e,n){let s;return t==="start"?s=n:t==="end"?s=e.options.reverse?e.min:e.max:Ae(t)?s=t.value:s=e.getBaseValue(),s}function VA(t){let e=t.options,n=e.fill,s=$e(n&&n.target,n);return s===void 0&&(s=!!e.backgroundColor),s===!1||s===null?!1:s===!0?"origin":s}function jA(t){let{scale:e,index:n,line:s}=t,o=[],r=s.segments,i=s.points,a=zA(e,n);a.push(c0({x:null,y:e.bottom},s));for(let l=0;l<r.length;l++){let c=r[l];for(let d=c.start;d<=c.end;d++)UA(o,i[d],a)}return new mr({points:o,options:{}})}function zA(t,e){let n=[],s=t.getMatchingVisibleMetas("line");for(let o=0;o<s.length;o++){let r=s[o];if(r.index===e)break;r.hidden||n.unshift(r.dataset)}return n}function UA(t,e,n){let s=[];for(let o=0;o<n.length;o++){let r=n[o],{first:i,last:a,point:l}=KA(r,e,"x");if(!(!l||i&&a)){if(i)s.unshift(l);else if(t.push(l),!a)break}}t.push(...s)}function KA(t,e,n){let s=t.interpolate(e,n);if(!s)return{};let o=s[n],r=t.segments,i=t.points,a=!1,l=!1;for(let c=0;c<r.length;c++){let d=r[c],u=i[d.start][n],p=i[d.end][n];if(Bn(o,u,p)){a=o===u,l=o===p;break}}return{first:a,last:l,point:s}}var tc=class{constructor(e){this.x=e.x,this.y=e.y,this.radius=e.radius}pathSegment(e,n,s){let{x:o,y:r,radius:i}=this;return n=n||{start:0,end:Ye},e.arc(o,r,i,n.end,n.start,!0),!s.bounds}interpolate(e){let{x:n,y:s,radius:o}=this,r=e.angle;return{x:n+Math.cos(r)*o,y:s+Math.sin(r)*o,angle:r}}};function GA(t){let{chart:e,fill:n,line:s}=t;if(at(n))return qA(e,n);if(n==="stack")return jA(t);if(n==="shape")return!0;let o=JA(t);return o instanceof tc?o:c0(o,s)}function qA(t,e){let n=t.getDatasetMeta(e);return n&&t.isDatasetVisible(e)?n.dataset:null}function JA(t){return(t.scale||{}).getPointPositionForValue?YA(t):ZA(t)}function ZA(t){let{scale:e={},fill:n}=t,s=HA(n,e);if(at(s)){let o=e.isHorizontal();return{x:o?s:null,y:o?null:s}}return null}function YA(t){let{scale:e,fill:n}=t,s=e.options,o=e.getLabels().length,r=s.reverse?e.max:e.min,i=WA(n,e,r),a=[];if(s.grid.circular){let l=e.getPointPositionForValue(0,r);return new tc({x:l.x,y:l.y,radius:e.getDistanceFromCenterForValue(i)})}for(let l=0;l<o;++l)a.push(e.getPointPositionForValue(l,i));return a}function sp(t,e,n){let s=GA(e),{chart:o,index:r,line:i,scale:a,axis:l}=e,c=i.options,d=c.fill,u=c.backgroundColor,{above:p=u,below:f=u}=d||{},g=o.getDatasetMeta(r),m=Gu(o,g);s&&i.points.length&&(bi(t,n),XA(t,{line:i,target:s,above:p,below:f,area:n,scale:a,axis:l,clip:m}),xi(t))}function XA(t,e){let{line:n,target:s,above:o,below:r,area:i,scale:a,clip:l}=e,c=n._loop?"angle":e.axis;t.save();let d=r;r!==o&&(c==="x"?(A$(t,s,i.top),op(t,{line:n,target:s,color:o,scale:a,property:c,clip:l}),t.restore(),t.save(),A$(t,s,i.bottom)):c==="y"&&(T$(t,s,i.left),op(t,{line:n,target:s,color:r,scale:a,property:c,clip:l}),t.restore(),t.save(),T$(t,s,i.right),d=o)),op(t,{line:n,target:s,color:d,scale:a,property:c,clip:l}),t.restore()}function A$(t,e,n){let{segments:s,points:o}=e,r=!0,i=!1;t.beginPath();for(let a of s){let{start:l,end:c}=a,d=o[l],u=o[oc(l,c,o)];r?(t.moveTo(d.x,d.y),r=!1):(t.lineTo(d.x,n),t.lineTo(d.x,d.y)),i=!!e.pathSegment(t,a,{move:i}),i?t.closePath():t.lineTo(u.x,n)}t.lineTo(e.first().x,n),t.closePath(),t.clip()}function T$(t,e,n){let{segments:s,points:o}=e,r=!0,i=!1;t.beginPath();for(let a of s){let{start:l,end:c}=a,d=o[l],u=o[oc(l,c,o)];r?(t.moveTo(d.x,d.y),r=!1):(t.lineTo(n,d.y),t.lineTo(d.x,d.y)),i=!!e.pathSegment(t,a,{move:i}),i?t.closePath():t.lineTo(n,u.y)}t.lineTo(n,e.first().y),t.closePath(),t.clip()}function op(t,e){let{line:n,target:s,property:o,color:r,scale:i,clip:a}=e,l=DA(n,s,o);for(let{source:c,target:d,start:u,end:p}of l){let{style:{backgroundColor:f=r}={}}=c,g=s!==!0;t.save(),t.fillStyle=f,QA(t,i,a,g&&_p(o,u,p)),t.beginPath();let m=!!n.pathSegment(t,c),h;if(g){m?t.closePath():P$(t,s,p,o);let b=!!s.pathSegment(t,d,{move:m,reverse:!0});h=m&&b,h||P$(t,s,u,o)}t.closePath(),t.fill(h?"evenodd":"nonzero"),t.restore()}}function QA(t,e,n,s){let o=e.chart.chartArea,{property:r,start:i,end:a}=s||{};if(r==="x"||r==="y"){let l,c,d,u;r==="x"?(l=i,c=o.top,d=a,u=o.bottom):(l=o.left,c=i,d=o.right,u=a),t.beginPath(),n&&(l=Math.max(l,n.left),d=Math.min(d,n.right),c=Math.max(c,n.top),u=Math.min(u,n.bottom)),t.rect(l,c,d-l,u-c),t.clip()}}function P$(t,e,n,s){let o=e.interpolate(n,s);o&&t.lineTo(o.x,o.y)}var eT={id:"filler",afterDatasetsUpdate(t,e,n){let s=(t.data.datasets||[]).length,o=[],r,i,a,l;for(i=0;i<s;++i)r=t.getDatasetMeta(i),a=r.dataset,l=null,a&&a.options&&a instanceof mr&&(l={visible:t.isDatasetVisible(i),index:i,fill:BA(a,i,s),chart:t,axis:r.controller.options.indexAxis,scale:r.vScale,line:a}),r.$filler=l,o.push(l);for(i=0;i<s;++i)l=o[i],!(!l||l.fill===!1)&&(l.fill=OA(o,i,n.propagate))},beforeDraw(t,e,n){let s=n.drawTime==="beforeDraw",o=t.getSortedVisibleDatasetMetas(),r=t.chartArea;for(let i=o.length-1;i>=0;--i){let a=o[i].$filler;a&&(a.line.updateControlPoints(r,a.axis),s&&a.fill&&sp(t.ctx,a,r))}},beforeDatasetsDraw(t,e,n){if(n.drawTime!=="beforeDatasetsDraw")return;let s=t.getSortedVisibleDatasetMetas();for(let o=s.length-1;o>=0;--o){let r=s[o].$filler;M$(r)&&sp(t.ctx,r,t.chartArea)}},beforeDatasetDraw(t,e,n){let s=e.meta.$filler;!M$(s)||n.drawTime!=="beforeDatasetDraw"||sp(t.ctx,s,t.chartArea)},defaults:{propagate:!0,drawTime:"beforeDatasetDraw"}},R$=(t,e)=>{let{boxHeight:n=e,boxWidth:s=e}=t;return t.usePointStyle&&(n=Math.min(n,e),s=t.pointStyleWidth||Math.min(s,e)),{boxWidth:s,boxHeight:n,itemHeight:Math.max(e,n)}},tT=(t,e)=>t!==null&&e!==null&&t.datasetIndex===e.datasetIndex&&t.index===e.index,nc=class extends kn{constructor(e){super(),this._added=!1,this.legendHitBoxes=[],this._hoveredItem=null,this.doughnutMode=!1,this.chart=e.chart,this.options=e.options,this.ctx=e.ctx,this.legendItems=void 0,this.columnSizes=void 0,this.lineWidths=void 0,this.maxHeight=void 0,this.maxWidth=void 0,this.top=void 0,this.bottom=void 0,this.left=void 0,this.right=void 0,this.height=void 0,this.width=void 0,this._margins=void 0,this.position=void 0,this.weight=void 0,this.fullSize=void 0}update(e,n,s){this.maxWidth=e,this.maxHeight=n,this._margins=s,this.setDimensions(),this.buildLabels(),this.fit()}setDimensions(){this.isHorizontal()?(this.width=this.maxWidth,this.left=this._margins.left,this.right=this.width):(this.height=this.maxHeight,this.top=this._margins.top,this.bottom=this.height)}buildLabels(){let e=this.options.labels||{},n=qe(e.generateLabels,[this.chart],this)||[];e.filter&&(n=n.filter(s=>e.filter(s,this.chart.data))),e.sort&&(n=n.sort((s,o)=>e.sort(s,o,this.chart.data))),this.options.reverse&&n.reverse(),this.legendItems=n}fit(){let{options:e,ctx:n}=this;if(!e.display){this.width=this.height=0;return}let s=e.labels,o=ht(s.font),r=o.size,i=this._computeTitleHeight(),{boxWidth:a,itemHeight:l}=R$(s,r),c,d;n.font=o.string,this.isHorizontal()?(c=this.maxWidth,d=this._fitRows(i,r,a,l)+10):(d=this.maxHeight,c=this._fitCols(i,o,a,l)+10),this.width=Math.min(c,e.maxWidth||this.maxWidth),this.height=Math.min(d,e.maxHeight||this.maxHeight)}_fitRows(e,n,s,o){let{ctx:r,maxWidth:i,options:{labels:{padding:a}}}=this,l=this.legendHitBoxes=[],c=this.lineWidths=[0],d=o+a,u=e;r.textAlign="left",r.textBaseline="middle";let p=-1,f=-d;return this.legendItems.forEach((g,m)=>{let h=s+n/2+r.measureText(g.text).width;(m===0||c[c.length-1]+h+2*a>i)&&(u+=d,c[c.length-(m>0?0:1)]=0,f+=d,p++),l[m]={left:0,top:f,row:p,width:h,height:o},c[c.length-1]+=h+a}),u}_fitCols(e,n,s,o){let{ctx:r,maxHeight:i,options:{labels:{padding:a}}}=this,l=this.legendHitBoxes=[],c=this.columnSizes=[],d=i-e,u=a,p=0,f=0,g=0,m=0;return this.legendItems.forEach((h,b)=>{let{itemWidth:x,itemHeight:v}=nT(s,n,r,h,o);b>0&&f+v+2*a>d&&(u+=p+a,c.push({width:p,height:f}),g+=p+a,m++,p=f=0),l[b]={left:g,top:f,col:m,width:x,height:v},p=Math.max(p,x),f+=v+a}),u+=p,c.push({width:p,height:f}),u}adjustHitBoxes(){if(!this.options.display)return;let e=this._computeTitleHeight(),{legendHitBoxes:n,options:{align:s,labels:{padding:o},rtl:r}}=this,i=ao(r,this.left,this.width);if(this.isHorizontal()){let a=0,l=It(s,this.left+o,this.right-this.lineWidths[a]);for(let c of n)a!==c.row&&(a=c.row,l=It(s,this.left+o,this.right-this.lineWidths[a])),c.top+=this.top+e+o,c.left=i.leftForLtr(i.x(l),c.width),l+=c.width+o}else{let a=0,l=It(s,this.top+e+o,this.bottom-this.columnSizes[a].height);for(let c of n)c.col!==a&&(a=c.col,l=It(s,this.top+e+o,this.bottom-this.columnSizes[a].height)),c.top=l,c.left+=this.left+o,c.left=i.leftForLtr(i.x(c.left),c.width),l+=c.height+o}}isHorizontal(){return this.options.position==="top"||this.options.position==="bottom"}draw(){if(this.options.display){let e=this.ctx;bi(e,this),this._draw(),xi(e)}}_draw(){let{options:e,columnSizes:n,lineWidths:s,ctx:o}=this,{align:r,labels:i}=e,a=Qe.color,l=ao(e.rtl,this.left,this.width),c=ht(i.font),{padding:d}=i,u=c.size,p=u/2,f;this.drawTitle(),o.textAlign=l.textAlign("left"),o.textBaseline="middle",o.lineWidth=.5,o.font=c.string;let{boxWidth:g,boxHeight:m,itemHeight:h}=R$(i,u),b=function(S,C,_){if(isNaN(g)||g<=0||isNaN(m)||m<0)return;o.save();let k=$e(_.lineWidth,1);if(o.fillStyle=$e(_.fillStyle,a),o.lineCap=$e(_.lineCap,"butt"),o.lineDashOffset=$e(_.lineDashOffset,0),o.lineJoin=$e(_.lineJoin,"miter"),o.lineWidth=k,o.strokeStyle=$e(_.strokeStyle,a),o.setLineDash($e(_.lineDash,[])),i.usePointStyle){let A={radius:m*Math.SQRT2/2,pointStyle:_.pointStyle,rotation:_.rotation,borderWidth:k},O=l.xPlus(S,g/2),D=C+p;Du(o,A,O,D,i.pointStyleWidth&&g)}else{let A=C+Math.max((u-m)/2,0),O=l.leftForLtr(S,g),D=Ps(_.borderRadius);o.beginPath(),Object.values(D).some(z=>z!==0)?dr(o,{x:O,y:A,w:g,h:m,radius:D}):o.rect(O,A,g,m),o.fill(),k!==0&&o.stroke()}o.restore()},x=function(S,C,_){Ts(o,_.text,S,C+h/2,c,{strikethrough:_.hidden,textAlign:l.textAlign(_.textAlign)})},v=this.isHorizontal(),w=this._computeTitleHeight();v?f={x:It(r,this.left+d,this.right-s[0]),y:this.top+d+w,line:0}:f={x:this.left+d,y:It(r,this.top+w+d,this.bottom-n[0].height),line:0},ju(this.ctx,e.textDirection);let $=h+d;this.legendItems.forEach((S,C)=>{o.strokeStyle=S.fontColor,o.fillStyle=S.fontColor;let _=o.measureText(S.text).width,k=l.textAlign(S.textAlign||(S.textAlign=i.textAlign)),A=g+p+_,O=f.x,D=f.y;l.setWidth(this.width),v?C>0&&O+A+d>this.right&&(D=f.y+=$,f.line++,O=f.x=It(r,this.left+d,this.right-s[f.line])):C>0&&D+$>this.bottom&&(O=f.x=O+n[f.line].width+d,f.line++,D=f.y=It(r,this.top+w+d,this.bottom-n[f.line].height));let z=l.x(O);if(b(z,D,S),O=Rv(k,O+g+p,v?O+A:this.right,e.rtl),x(l.x(O),D,S),v)f.x+=A+d;else if(typeof S.text!="string"){let E=c.lineHeight;f.y+=d0(S,E)+d}else f.y+=$}),zu(this.ctx,e.textDirection)}drawTitle(){let e=this.options,n=e.title,s=ht(n.font),o=Dt(n.padding);if(!n.display)return;let r=ao(e.rtl,this.left,this.width),i=this.ctx,a=n.position,l=s.size/2,c=o.top+l,d,u=this.left,p=this.width;if(this.isHorizontal())p=Math.max(...this.lineWidths),d=this.top+c,u=It(e.align,u,this.right-p);else{let g=this.columnSizes.reduce((m,h)=>Math.max(m,h.height),0);d=c+It(e.align,this.top,this.bottom-g-e.labels.padding-this._computeTitleHeight())}let f=It(a,u,u+p);i.textAlign=r.textAlign(Il(a)),i.textBaseline="middle",i.strokeStyle=n.color,i.fillStyle=n.color,i.font=s.string,Ts(i,n.text,f,d,s)}_computeTitleHeight(){let e=this.options.title,n=ht(e.font),s=Dt(e.padding);return e.display?n.lineHeight+s.height:0}_getLegendItemAt(e,n){let s,o,r;if(Bn(e,this.left,this.right)&&Bn(n,this.top,this.bottom)){for(r=this.legendHitBoxes,s=0;s<r.length;++s)if(o=r[s],Bn(e,o.left,o.left+o.width)&&Bn(n,o.top,o.top+o.height))return this.legendItems[s]}return null}handleEvent(e){let n=this.options;if(!rT(e.type,n))return;let s=this._getLegendItemAt(e.x,e.y);if(e.type==="mousemove"||e.type==="mouseout"){let o=this._hoveredItem,r=tT(o,s);o&&!r&&qe(n.onLeave,[e,o,this],this),this._hoveredItem=s,s&&!r&&qe(n.onHover,[e,s,this],this)}else s&&qe(n.onClick,[e,s,this],this)}};function nT(t,e,n,s,o){let r=sT(s,t,e,n),i=oT(o,s,e.lineHeight);return{itemWidth:r,itemHeight:i}}function sT(t,e,n,s){let o=t.text;return o&&typeof o!="string"&&(o=o.reduce((r,i)=>r.length>i.length?r:i)),e+n.size/2+s.measureText(o).width}function oT(t,e,n){let s=t;return typeof e.text!="string"&&(s=d0(e,n)),s}function d0(t,e){let n=t.text?t.text.length:0;return e*n}function rT(t,e){return!!((t==="mousemove"||t==="mouseout")&&(e.onHover||e.onLeave)||e.onClick&&(t==="click"||t==="mouseup"))}var iT={id:"legend",_element:nc,start(t,e,n){let s=t.legend=new nc({ctx:t.ctx,options:n,chart:t});Ft.configure(t,s,n),Ft.addBox(t,s)},stop(t){Ft.removeBox(t,t.legend),delete t.legend},beforeUpdate(t,e,n){let s=t.legend;Ft.configure(t,s,n),s.options=n},afterUpdate(t){let e=t.legend;e.buildLabels(),e.adjustHitBoxes()},afterEvent(t,e){e.replay||t.legend.handleEvent(e.event)},defaults:{display:!0,position:"top",align:"center",fullSize:!0,reverse:!1,weight:1e3,onClick(t,e,n){let s=e.datasetIndex,o=n.chart;o.isDatasetVisible(s)?(o.hide(s),e.hidden=!0):(o.show(s),e.hidden=!1)},onHover:null,onLeave:null,labels:{color:t=>t.chart.options.color,boxWidth:40,padding:10,generateLabels(t){let e=t.data.datasets,{labels:{usePointStyle:n,pointStyle:s,textAlign:o,color:r,useBorderRadius:i,borderRadius:a}}=t.legend.options;return t._getSortedDatasetMetas().map(l=>{let c=l.controller.getStyle(n?0:void 0),d=Dt(c.borderWidth);return{text:e[l.index].label,fillStyle:c.backgroundColor,fontColor:r,hidden:!l.visible,lineCap:c.borderCapStyle,lineDash:c.borderDash,lineDashOffset:c.borderDashOffset,lineJoin:c.borderJoinStyle,lineWidth:(d.width+d.height)/4,strokeStyle:c.borderColor,pointStyle:s||c.pointStyle,rotation:c.rotation,textAlign:o||c.textAlign,borderRadius:i&&(a||c.borderRadius),datasetIndex:l.index}},this)}},title:{color:t=>t.chart.options.color,display:!1,position:"center",text:""}},descriptors:{_scriptable:t=>!t.startsWith("on"),labels:{_scriptable:t=>!["generateLabels","filter","sort"].includes(t)}}},Ai=class extends kn{constructor(e){super(),this.chart=e.chart,this.options=e.options,this.ctx=e.ctx,this._padding=void 0,this.top=void 0,this.bottom=void 0,this.left=void 0,this.right=void 0,this.width=void 0,this.height=void 0,this.position=void 0,this.weight=void 0,this.fullSize=void 0}update(e,n){let s=this.options;if(this.left=0,this.top=0,!s.display){this.width=this.height=this.right=this.bottom=0;return}this.width=this.right=e,this.height=this.bottom=n;let o=Ze(s.text)?s.text.length:1;this._padding=Dt(s.padding);let r=o*ht(s.font).lineHeight+this._padding.height;this.isHorizontal()?this.height=r:this.width=r}isHorizontal(){let e=this.options.position;return e==="top"||e==="bottom"}_drawArgs(e){let{top:n,left:s,bottom:o,right:r,options:i}=this,a=i.align,l=0,c,d,u;return this.isHorizontal()?(d=It(a,s,r),u=n+e,c=r-s):(i.position==="left"?(d=s+e,u=It(a,o,n),l=Oe*-.5):(d=r-e,u=It(a,n,o),l=Oe*.5),c=o-n),{titleX:d,titleY:u,maxWidth:c,rotation:l}}draw(){let e=this.ctx,n=this.options;if(!n.display)return;let s=ht(n.font),r=s.lineHeight/2+this._padding.top,{titleX:i,titleY:a,maxWidth:l,rotation:c}=this._drawArgs(r);Ts(e,n.text,0,0,s,{color:n.color,maxWidth:l,rotation:c,textAlign:Il(n.align),textBaseline:"middle",translation:[i,a]})}};function aT(t,e){let n=new Ai({ctx:t.ctx,options:e,chart:t});Ft.configure(t,n,e),Ft.addBox(t,n),t.titleBlock=n}var lT={id:"title",_element:Ai,start(t,e,n){aT(t,n)},stop(t){let e=t.titleBlock;Ft.removeBox(t,e),delete t.titleBlock},beforeUpdate(t,e,n){let s=t.titleBlock;Ft.configure(t,s,n),s.options=n},defaults:{align:"center",display:!1,font:{weight:"bold"},fullSize:!0,padding:10,position:"top",text:"",weight:2e3},defaultRoutes:{color:"color"},descriptors:{_scriptable:!0,_indexable:!1}},Ul=new WeakMap,cT={id:"subtitle",start(t,e,n){let s=new Ai({ctx:t.ctx,options:n,chart:t});Ft.configure(t,s,n),Ft.addBox(t,s),Ul.set(t,s)},stop(t){Ft.removeBox(t,Ul.get(t)),Ul.delete(t)},beforeUpdate(t,e,n){let s=Ul.get(t);Ft.configure(t,s,n),s.options=n},defaults:{align:"center",display:!1,font:{weight:"normal"},fullSize:!0,padding:0,position:"top",text:"",weight:1500},defaultRoutes:{color:"color"},descriptors:{_scriptable:!0,_indexable:!1}},Ci={average(t){if(!t.length)return!1;let e,n,s=new Set,o=0,r=0;for(e=0,n=t.length;e<n;++e){let a=t[e].element;if(a&&a.hasValue()){let l=a.tooltipPosition();s.add(l.x),o+=l.y,++r}}return r===0||s.size===0?!1:{x:[...s].reduce((a,l)=>a+l)/s.size,y:o/r}},nearest(t,e){if(!t.length)return!1;let n=e.x,s=e.y,o=Number.POSITIVE_INFINITY,r,i,a;for(r=0,i=t.length;r<i;++r){let l=t[r].element;if(l&&l.hasValue()){let c=l.getCenterPoint(),d=Tl(e,c);d<o&&(o=d,a=l)}}if(a){let l=a.tooltipPosition();n=l.x,s=l.y}return{x:n,y:s}}};function Fn(t,e){return e&&(Ze(e)?Array.prototype.push.apply(t,e):t.push(e)),t}function as(t){return(typeof t=="string"||t instanceof String)&&t.indexOf(`
`)>-1?t.split(`
`):t}function dT(t,e){let{element:n,datasetIndex:s,index:o}=e,r=t.getDatasetMeta(s).controller,{label:i,value:a}=r.getLabelAndValue(o);return{chart:t,label:i,parsed:r.getParsed(o),raw:t.data.datasets[s].data[o],formattedValue:a,dataset:r.getDataset(),dataIndex:o,datasetIndex:s,element:n}}function L$(t,e){let n=t.chart.ctx,{body:s,footer:o,title:r}=t,{boxWidth:i,boxHeight:a}=e,l=ht(e.bodyFont),c=ht(e.titleFont),d=ht(e.footerFont),u=r.length,p=o.length,f=s.length,g=Dt(e.padding),m=g.height,h=0,b=s.reduce((w,$)=>w+$.before.length+$.lines.length+$.after.length,0);if(b+=t.beforeBody.length+t.afterBody.length,u&&(m+=u*c.lineHeight+(u-1)*e.titleSpacing+e.titleMarginBottom),b){let w=e.displayColors?Math.max(a,l.lineHeight):l.lineHeight;m+=f*w+(b-f)*l.lineHeight+(b-1)*e.bodySpacing}p&&(m+=e.footerMarginTop+p*d.lineHeight+(p-1)*e.footerSpacing);let x=0,v=function(w){h=Math.max(h,n.measureText(w).width+x)};return n.save(),n.font=c.string,ze(t.title,v),n.font=l.string,ze(t.beforeBody.concat(t.afterBody),v),x=e.displayColors?i+2+e.boxPadding:0,ze(s,w=>{ze(w.before,v),ze(w.lines,v),ze(w.after,v)}),x=0,n.font=d.string,ze(t.footer,v),n.restore(),h+=g.width,{width:h,height:m}}function uT(t,e){let{y:n,height:s}=e;return n<s/2?"top":n>t.height-s/2?"bottom":"center"}function pT(t,e,n,s){let{x:o,width:r}=s,i=n.caretSize+n.caretPadding;if(t==="left"&&o+r+i>e.width||t==="right"&&o-r-i<0)return!0}function fT(t,e,n,s){let{x:o,width:r}=n,{width:i,chartArea:{left:a,right:l}}=t,c="center";return s==="center"?c=o<=(a+l)/2?"left":"right":o<=r/2?c="left":o>=i-r/2&&(c="right"),pT(c,t,e,n)&&(c="center"),c}function E$(t,e,n){let s=n.yAlign||e.yAlign||uT(t,n);return{xAlign:n.xAlign||e.xAlign||fT(t,e,n,s),yAlign:s}}function hT(t,e){let{x:n,width:s}=t;return e==="right"?n-=s:e==="center"&&(n-=s/2),n}function mT(t,e,n){let{y:s,height:o}=t;return e==="top"?s+=n:e==="bottom"?s-=o+n:s-=o/2,s}function I$(t,e,n,s){let{caretSize:o,caretPadding:r,cornerRadius:i}=t,{xAlign:a,yAlign:l}=n,c=o+r,{topLeft:d,topRight:u,bottomLeft:p,bottomRight:f}=Ps(i),g=hT(e,a),m=mT(e,l,c);return l==="center"?a==="left"?g+=c:a==="right"&&(g-=c):a==="left"?g-=Math.max(d,p)+o:a==="right"&&(g+=Math.max(u,f)+o),{x:vt(g,0,s.width-e.width),y:vt(m,0,s.height-e.height)}}function Kl(t,e,n){let s=Dt(n.padding);return e==="center"?t.x+t.width/2:e==="right"?t.x+t.width-s.right:t.x+s.left}function D$(t){return Fn([],as(t))}function gT(t,e,n){return rs(t,{tooltip:e,tooltipItems:n,type:"tooltip"})}function N$(t,e){let n=e&&e.dataset&&e.dataset.tooltip&&e.dataset.tooltip.callbacks;return n?t.override(n):t}var u0={beforeTitle:On,title(t){if(t.length>0){let e=t[0],n=e.chart.data.labels,s=n?n.length:0;if(this&&this.options&&this.options.mode==="dataset")return e.dataset.label||"";if(e.label)return e.label;if(s>0&&e.dataIndex<s)return n[e.dataIndex]}return""},afterTitle:On,beforeBody:On,beforeLabel:On,label(t){if(this&&this.options&&this.options.mode==="dataset")return t.label+": "+t.formattedValue||t.formattedValue;let e=t.dataset.label||"";e&&(e+=": ");let n=t.formattedValue;return _e(n)||(e+=n),e},labelColor(t){let n=t.chart.getDatasetMeta(t.datasetIndex).controller.getStyle(t.dataIndex);return{borderColor:n.borderColor,backgroundColor:n.backgroundColor,borderWidth:n.borderWidth,borderDash:n.borderDash,borderDashOffset:n.borderDashOffset,borderRadius:0}},labelTextColor(){return this.options.bodyColor},labelPointStyle(t){let n=t.chart.getDatasetMeta(t.datasetIndex).controller.getStyle(t.dataIndex);return{pointStyle:n.pointStyle,rotation:n.rotation}},afterLabel:On,afterBody:On,beforeFooter:On,footer:On,afterFooter:On};function Yt(t,e,n,s){let o=t[e].call(n,s);return typeof o>"u"?u0[e].call(n,s):o}var sc=class extends kn{static positioners=Ci;constructor(e){super(),this.opacity=0,this._active=[],this._eventPosition=void 0,this._size=void 0,this._cachedAnimations=void 0,this._tooltipItems=[],this.$animations=void 0,this.$context=void 0,this.chart=e.chart,this.options=e.options,this.dataPoints=void 0,this.title=void 0,this.beforeBody=void 0,this.body=void 0,this.afterBody=void 0,this.footer=void 0,this.xAlign=void 0,this.yAlign=void 0,this.x=void 0,this.y=void 0,this.height=void 0,this.width=void 0,this.caretX=void 0,this.caretY=void 0,this.labelColors=void 0,this.labelPointStyles=void 0,this.labelTextColors=void 0}initialize(e){this.options=e,this._cachedAnimations=void 0,this.$context=void 0}_resolveAnimations(){let e=this._cachedAnimations;if(e)return e;let n=this.chart,s=this.options.setContext(this.getContext()),o=s.enabled&&n.options.animation&&s.animations,r=new Zl(this.chart,o);return o._cacheable&&(this._cachedAnimations=Object.freeze(r)),r}getContext(){return this.$context||(this.$context=gT(this.chart.getContext(),this,this._tooltipItems))}getTitle(e,n){let{callbacks:s}=n,o=Yt(s,"beforeTitle",this,e),r=Yt(s,"title",this,e),i=Yt(s,"afterTitle",this,e),a=[];return a=Fn(a,as(o)),a=Fn(a,as(r)),a=Fn(a,as(i)),a}getBeforeBody(e,n){return D$(Yt(n.callbacks,"beforeBody",this,e))}getBody(e,n){let{callbacks:s}=n,o=[];return ze(e,r=>{let i={before:[],lines:[],after:[]},a=N$(s,r);Fn(i.before,as(Yt(a,"beforeLabel",this,r))),Fn(i.lines,Yt(a,"label",this,r)),Fn(i.after,as(Yt(a,"afterLabel",this,r))),o.push(i)}),o}getAfterBody(e,n){return D$(Yt(n.callbacks,"afterBody",this,e))}getFooter(e,n){let{callbacks:s}=n,o=Yt(s,"beforeFooter",this,e),r=Yt(s,"footer",this,e),i=Yt(s,"afterFooter",this,e),a=[];return a=Fn(a,as(o)),a=Fn(a,as(r)),a=Fn(a,as(i)),a}_createItems(e){let n=this._active,s=this.chart.data,o=[],r=[],i=[],a=[],l,c;for(l=0,c=n.length;l<c;++l)a.push(dT(this.chart,n[l]));return e.filter&&(a=a.filter((d,u,p)=>e.filter(d,u,p,s))),e.itemSort&&(a=a.sort((d,u)=>e.itemSort(d,u,s))),ze(a,d=>{let u=N$(e.callbacks,d);o.push(Yt(u,"labelColor",this,d)),r.push(Yt(u,"labelPointStyle",this,d)),i.push(Yt(u,"labelTextColor",this,d))}),this.labelColors=o,this.labelPointStyles=r,this.labelTextColors=i,this.dataPoints=a,a}update(e,n){let s=this.options.setContext(this.getContext()),o=this._active,r,i=[];if(!o.length)this.opacity!==0&&(r={opacity:0});else{let a=Ci[s.position].call(this,o,this._eventPosition);i=this._createItems(s),this.title=this.getTitle(i,s),this.beforeBody=this.getBeforeBody(i,s),this.body=this.getBody(i,s),this.afterBody=this.getAfterBody(i,s),this.footer=this.getFooter(i,s);let l=this._size=L$(this,s),c=Object.assign({},a,l),d=E$(this.chart,s,c),u=I$(s,c,d,this.chart);this.xAlign=d.xAlign,this.yAlign=d.yAlign,r={opacity:1,x:u.x,y:u.y,width:l.width,height:l.height,caretX:a.x,caretY:a.y}}this._tooltipItems=i,this.$context=void 0,r&&this._resolveAnimations().update(this,r),e&&s.external&&s.external.call(this,{chart:this.chart,tooltip:this,replay:n})}drawCaret(e,n,s,o){let r=this.getCaretPosition(e,s,o);n.lineTo(r.x1,r.y1),n.lineTo(r.x2,r.y2),n.lineTo(r.x3,r.y3)}getCaretPosition(e,n,s){let{xAlign:o,yAlign:r}=this,{caretSize:i,cornerRadius:a}=s,{topLeft:l,topRight:c,bottomLeft:d,bottomRight:u}=Ps(a),{x:p,y:f}=e,{width:g,height:m}=n,h,b,x,v,w,$;return r==="center"?(w=f+m/2,o==="left"?(h=p,b=h-i,v=w+i,$=w-i):(h=p+g,b=h+i,v=w-i,$=w+i),x=h):(o==="left"?b=p+Math.max(l,d)+i:o==="right"?b=p+g-Math.max(c,u)-i:b=this.caretX,r==="top"?(v=f,w=v-i,h=b-i,x=b+i):(v=f+m,w=v+i,h=b+i,x=b-i),$=v),{x1:h,x2:b,x3:x,y1:v,y2:w,y3:$}}drawTitle(e,n,s){let o=this.title,r=o.length,i,a,l;if(r){let c=ao(s.rtl,this.x,this.width);for(e.x=Kl(this,s.titleAlign,s),n.textAlign=c.textAlign(s.titleAlign),n.textBaseline="middle",i=ht(s.titleFont),a=s.titleSpacing,n.fillStyle=s.titleColor,n.font=i.string,l=0;l<r;++l)n.fillText(o[l],c.x(e.x),e.y+i.lineHeight/2),e.y+=i.lineHeight+a,l+1===r&&(e.y+=s.titleMarginBottom-a)}}_drawColorBox(e,n,s,o,r){let i=this.labelColors[s],a=this.labelPointStyles[s],{boxHeight:l,boxWidth:c}=r,d=ht(r.bodyFont),u=Kl(this,"left",r),p=o.x(u),f=l<d.lineHeight?(d.lineHeight-l)/2:0,g=n.y+f;if(r.usePointStyle){let m={radius:Math.min(c,l)/2,pointStyle:a.pointStyle,rotation:a.rotation,borderWidth:1},h=o.leftForLtr(p,c)+c/2,b=g+l/2;e.strokeStyle=r.multiKeyBackground,e.fillStyle=r.multiKeyBackground,Nl(e,m,h,b),e.strokeStyle=i.borderColor,e.fillStyle=i.backgroundColor,Nl(e,m,h,b)}else{e.lineWidth=Ae(i.borderWidth)?Math.max(...Object.values(i.borderWidth)):i.borderWidth||1,e.strokeStyle=i.borderColor,e.setLineDash(i.borderDash||[]),e.lineDashOffset=i.borderDashOffset||0;let m=o.leftForLtr(p,c),h=o.leftForLtr(o.xPlus(p,1),c-2),b=Ps(i.borderRadius);Object.values(b).some(x=>x!==0)?(e.beginPath(),e.fillStyle=r.multiKeyBackground,dr(e,{x:m,y:g,w:c,h:l,radius:b}),e.fill(),e.stroke(),e.fillStyle=i.backgroundColor,e.beginPath(),dr(e,{x:h,y:g+1,w:c-2,h:l-2,radius:b}),e.fill()):(e.fillStyle=r.multiKeyBackground,e.fillRect(m,g,c,l),e.strokeRect(m,g,c,l),e.fillStyle=i.backgroundColor,e.fillRect(h,g+1,c-2,l-2))}e.fillStyle=this.labelTextColors[s]}drawBody(e,n,s){let{body:o}=this,{bodySpacing:r,bodyAlign:i,displayColors:a,boxHeight:l,boxWidth:c,boxPadding:d}=s,u=ht(s.bodyFont),p=u.lineHeight,f=0,g=ao(s.rtl,this.x,this.width),m=function(_){n.fillText(_,g.x(e.x+f),e.y+p/2),e.y+=p+r},h=g.textAlign(i),b,x,v,w,$,S,C;for(n.textAlign=i,n.textBaseline="middle",n.font=u.string,e.x=Kl(this,h,s),n.fillStyle=s.bodyColor,ze(this.beforeBody,m),f=a&&h!=="right"?i==="center"?c/2+d:c+2+d:0,w=0,S=o.length;w<S;++w){for(b=o[w],x=this.labelTextColors[w],n.fillStyle=x,ze(b.before,m),v=b.lines,a&&v.length&&(this._drawColorBox(n,e,w,g,s),p=Math.max(u.lineHeight,l)),$=0,C=v.length;$<C;++$)m(v[$]),p=u.lineHeight;ze(b.after,m)}f=0,p=u.lineHeight,ze(this.afterBody,m),e.y-=r}drawFooter(e,n,s){let o=this.footer,r=o.length,i,a;if(r){let l=ao(s.rtl,this.x,this.width);for(e.x=Kl(this,s.footerAlign,s),e.y+=s.footerMarginTop,n.textAlign=l.textAlign(s.footerAlign),n.textBaseline="middle",i=ht(s.footerFont),n.fillStyle=s.footerColor,n.font=i.string,a=0;a<r;++a)n.fillText(o[a],l.x(e.x),e.y+i.lineHeight/2),e.y+=i.lineHeight+s.footerSpacing}}drawBackground(e,n,s,o){let{xAlign:r,yAlign:i}=this,{x:a,y:l}=e,{width:c,height:d}=s,{topLeft:u,topRight:p,bottomLeft:f,bottomRight:g}=Ps(o.cornerRadius);n.fillStyle=o.backgroundColor,n.strokeStyle=o.borderColor,n.lineWidth=o.borderWidth,n.beginPath(),n.moveTo(a+u,l),i==="top"&&this.drawCaret(e,n,s,o),n.lineTo(a+c-p,l),n.quadraticCurveTo(a+c,l,a+c,l+p),i==="center"&&r==="right"&&this.drawCaret(e,n,s,o),n.lineTo(a+c,l+d-g),n.quadraticCurveTo(a+c,l+d,a+c-g,l+d),i==="bottom"&&this.drawCaret(e,n,s,o),n.lineTo(a+f,l+d),n.quadraticCurveTo(a,l+d,a,l+d-f),i==="center"&&r==="left"&&this.drawCaret(e,n,s,o),n.lineTo(a,l+u),n.quadraticCurveTo(a,l,a+u,l),n.closePath(),n.fill(),o.borderWidth>0&&n.stroke()}_updateAnimationTarget(e){let n=this.chart,s=this.$animations,o=s&&s.x,r=s&&s.y;if(o||r){let i=Ci[e.position].call(this,this._active,this._eventPosition);if(!i)return;let a=this._size=L$(this,e),l=Object.assign({},i,this._size),c=E$(n,e,l),d=I$(e,l,c,n);(o._to!==d.x||r._to!==d.y)&&(this.xAlign=c.xAlign,this.yAlign=c.yAlign,this.width=a.width,this.height=a.height,this.caretX=i.x,this.caretY=i.y,this._resolveAnimations().update(this,d))}}_willRender(){return!!this.opacity}draw(e){let n=this.options.setContext(this.getContext()),s=this.opacity;if(!s)return;this._updateAnimationTarget(n);let o={width:this.width,height:this.height},r={x:this.x,y:this.y};s=Math.abs(s)<.001?0:s;let i=Dt(n.padding),a=this.title.length||this.beforeBody.length||this.body.length||this.afterBody.length||this.footer.length;n.enabled&&a&&(e.save(),e.globalAlpha=s,this.drawBackground(r,e,o,n),ju(e,n.textDirection),r.y+=i.top,this.drawTitle(r,e,n),this.drawBody(r,e,n),this.drawFooter(r,e,n),zu(e,n.textDirection),e.restore())}getActiveElements(){return this._active||[]}setActiveElements(e,n){let s=this._active,o=e.map(({datasetIndex:a,index:l})=>{let c=this.chart.getDatasetMeta(a);if(!c)throw new Error("Cannot find a dataset at index "+a);return{datasetIndex:a,element:c.data[l],index:l}}),r=!mi(s,o),i=this._positionChanged(o,n);(r||i)&&(this._active=o,this._eventPosition=n,this._ignoreReplayEvents=!0,this.update(!0))}handleEvent(e,n,s=!0){if(n&&this._ignoreReplayEvents)return!1;this._ignoreReplayEvents=!1;let o=this.options,r=this._active||[],i=this._getActiveElements(e,r,n,s),a=this._positionChanged(i,e),l=n||!mi(i,r)||a;return l&&(this._active=i,(o.enabled||o.external)&&(this._eventPosition={x:e.x,y:e.y},this.update(!0,n))),l}_getActiveElements(e,n,s,o){let r=this.options;if(e.type==="mouseout")return[];if(!o)return n.filter(a=>this.chart.data.datasets[a.datasetIndex]&&this.chart.getDatasetMeta(a.datasetIndex).controller.getParsed(a.index)!==void 0);let i=this.chart.getElementsAtEventForMode(e,r.mode,r,s);return r.reverse&&i.reverse(),i}_positionChanged(e,n){let{caretX:s,caretY:o,options:r}=this,i=Ci[r.position].call(this,e,n);return i!==!1&&(s!==i.x||o!==i.y)}},bT={id:"tooltip",_element:sc,positioners:Ci,afterInit(t,e,n){n&&(t.tooltip=new sc({chart:t,options:n}))},beforeUpdate(t,e,n){t.tooltip&&t.tooltip.initialize(n)},reset(t,e,n){t.tooltip&&t.tooltip.initialize(n)},afterDraw(t){let e=t.tooltip;if(e&&e._willRender()){let n={tooltip:e};if(t.notifyPlugins("beforeTooltipDraw",{...n,cancelable:!0})===!1)return;e.draw(t.ctx),t.notifyPlugins("afterTooltipDraw",n)}},afterEvent(t,e){if(t.tooltip){let n=e.replay;t.tooltip.handleEvent(e.event,n,e.inChartArea)&&(e.changed=!0)}},defaults:{enabled:!0,external:null,position:"average",backgroundColor:"rgba(0,0,0,0.8)",titleColor:"#fff",titleFont:{weight:"bold"},titleSpacing:2,titleMarginBottom:6,titleAlign:"left",bodyColor:"#fff",bodySpacing:2,bodyFont:{},bodyAlign:"left",footerColor:"#fff",footerSpacing:2,footerMarginTop:6,footerFont:{weight:"bold"},footerAlign:"left",padding:6,caretPadding:2,caretSize:5,cornerRadius:6,boxHeight:(t,e)=>e.bodyFont.size,boxWidth:(t,e)=>e.bodyFont.size,multiKeyBackground:"#fff",displayColors:!0,boxPadding:0,borderColor:"rgba(0,0,0,0)",borderWidth:0,animation:{duration:400,easing:"easeOutQuart"},animations:{numbers:{type:"number",properties:["x","y","width","height","caretX","caretY"]},opacity:{easing:"linear",duration:200}},callbacks:u0},defaultRoutes:{bodyFont:"font",footerFont:"font",titleFont:"font"},descriptors:{_scriptable:t=>t!=="filter"&&t!=="itemSort"&&t!=="external",_indexable:!1,callbacks:{_scriptable:!1,_indexable:!1},animation:{_fallback:!1},animations:{_fallback:"animation"}},additionalOptionScopes:["interaction"]},xT=Object.freeze({__proto__:null,Colors:PA,Decimation:IA,Filler:eT,Legend:iT,SubTitle:cT,Title:lT,Tooltip:bT}),yT=(t,e,n,s)=>(typeof e=="string"?(n=t.push(e)-1,s.unshift({index:n,label:e})):isNaN(e)&&(n=null),n);function vT(t,e,n,s){let o=t.indexOf(e);if(o===-1)return yT(t,e,n,s);let r=t.lastIndexOf(e);return o!==r?n:o}var $T=(t,e)=>t===null?null:vt(Math.round(t),0,e);function O$(t){let e=this.getLabels();return t>=0&&t<e.length?e[t]:t}var Mp=class extends uo{static id="category";static defaults={ticks:{callback:O$}};constructor(e){super(e),this._startValue=void 0,this._valueRange=0,this._addedLabels=[]}init(e){let n=this._addedLabels;if(n.length){let s=this.getLabels();for(let{index:o,label:r}of n)s[o]===r&&s.splice(o,1);this._addedLabels=[]}super.init(e)}parse(e,n){if(_e(e))return null;let s=this.getLabels();return n=isFinite(n)&&s[n]===e?n:vT(s,e,$e(n,e),this._addedLabels),$T(n,s.length-1)}determineDataLimits(){let{minDefined:e,maxDefined:n}=this.getUserBounds(),{min:s,max:o}=this.getMinMax(!0);this.options.bounds==="ticks"&&(e||(s=0),n||(o=this.getLabels().length-1)),this.min=s,this.max=o}buildTicks(){let e=this.min,n=this.max,s=this.options.offset,o=[],r=this.getLabels();r=e===0&&n===r.length-1?r:r.slice(e,n+1),this._valueRange=Math.max(r.length-(s?0:1),1),this._startValue=this.min-(s?.5:0);for(let i=e;i<=n;i++)o.push({value:i});return o}getLabelForValue(e){return O$.call(this,e)}configure(){super.configure(),this.isHorizontal()||(this._reversePixels=!this._reversePixels)}getPixelForValue(e){return typeof e!="number"&&(e=this.parse(e)),e===null?NaN:this.getPixelForDecimal((e-this._startValue)/this._valueRange)}getPixelForTick(e){let n=this.ticks;return e<0||e>n.length-1?null:this.getPixelForValue(n[e].value)}getValueForPixel(e){return Math.round(this._startValue+this.getDecimalForPixel(e)*this._valueRange)}getBasePixel(){return this.bottom}};function wT(t,e){let n=[],{bounds:o,step:r,min:i,max:a,precision:l,count:c,maxTicks:d,maxDigits:u,includeBounds:p}=t,f=r||1,g=d-1,{min:m,max:h}=e,b=!_e(i),x=!_e(a),v=!_e(c),w=(h-m)/(u+1),$=wu((h-m)/g/f)*f,S,C,_,k;if($<1e-14&&!b&&!x)return[{value:m},{value:h}];k=Math.ceil(h/$)-Math.floor(m/$),k>g&&($=wu(k*$/g/f)*f),_e(l)||(S=Math.pow(10,l),$=Math.ceil($*S)/S),o==="ticks"?(C=Math.floor(m/$)*$,_=Math.ceil(h/$)*$):(C=m,_=h),b&&x&&r&&Sv((a-i)/r,$/1e3)?(k=Math.round(Math.min((a-i)/$,d)),$=(a-i)/k,C=i,_=a):v?(C=b?i:C,_=x?a:_,k=c-1,$=(_-C)/k):(k=(_-C)/$,ar(k,Math.round(k),$/1e3)?k=Math.round(k):k=Math.ceil(k));let A=Math.max(Su($),Su(C));S=Math.pow(10,_e(l)?A:l),C=Math.round(C*S)/S,_=Math.round(_*S)/S;let O=0;for(b&&(p&&C!==i?(n.push({value:i}),C<i&&O++,ar(Math.round((C+O*$)*S)/S,i,B$(i,w,t))&&O++):C<i&&O++);O<k;++O){let D=Math.round((C+O*$)*S)/S;if(x&&D>a)break;n.push({value:D})}return x&&p&&_!==a?n.length&&ar(n[n.length-1].value,a,B$(a,w,t))?n[n.length-1].value=a:n.push({value:a}):(!x||_===a)&&n.push({value:_}),n}function B$(t,e,{horizontal:n,minRotation:s}){let o=pn(s),r=(n?Math.sin(o):Math.cos(o))||.001,i=.75*e*(""+t).length;return Math.min(e/r,i)}var gr=class extends uo{constructor(e){super(e),this.start=void 0,this.end=void 0,this._startValue=void 0,this._endValue=void 0,this._valueRange=0}parse(e,n){return _e(e)||(typeof e=="number"||e instanceof Number)&&!isFinite(+e)?null:+e}handleTickRangeOptions(){let{beginAtZero:e}=this.options,{minDefined:n,maxDefined:s}=this.getUserBounds(),{min:o,max:r}=this,i=l=>o=n?o:l,a=l=>r=s?r:l;if(e){let l=wn(o),c=wn(r);l<0&&c<0?a(0):l>0&&c>0&&i(0)}if(o===r){let l=r===0?1:Math.abs(r*.05);a(r+l),e||i(o-l)}this.min=o,this.max=r}getTickLimit(){let e=this.options.ticks,{maxTicksLimit:n,stepSize:s}=e,o;return s?(o=Math.ceil(this.max/s)-Math.floor(this.min/s)+1,o>1e3&&(console.warn(`scales.${this.id}.ticks.stepSize: ${s} would result generating up to ${o} ticks. Limiting to 1000.`),o=1e3)):(o=this.computeTickLimit(),n=n||11),n&&(o=Math.min(n,o)),o}computeTickLimit(){return Number.POSITIVE_INFINITY}buildTicks(){let e=this.options,n=e.ticks,s=this.getTickLimit();s=Math.max(2,s);let o={maxTicks:s,bounds:e.bounds,min:e.min,max:e.max,precision:n.precision,step:n.stepSize,count:n.count,maxDigits:this._maxDigits(),horizontal:this.isHorizontal(),minRotation:n.minRotation||0,includeBounds:n.includeBounds!==!1},r=this._range||this,i=wT(o,r);return e.bounds==="ticks"&&ku(i,this,"value"),e.reverse?(i.reverse(),this.start=this.max,this.end=this.min):(this.start=this.min,this.end=this.max),i}configure(){let e=this.ticks,n=this.min,s=this.max;if(super.configure(),this.options.offset&&e.length){let o=(s-n)/Math.max(e.length-1,1)/2;n-=o,s+=o}this._startValue=n,this._endValue=s,this._valueRange=s-n}getLabelForValue(e){return cr(e,this.chart.options.locale,this.options.ticks.format)}},Ap=class extends gr{static id="linear";static defaults={ticks:{callback:gi.formatters.numeric}};determineDataLimits(){let{min:e,max:n}=this.getMinMax(!0);this.min=at(e)?e:0,this.max=at(n)?n:1,this.handleTickRangeOptions()}computeTickLimit(){let e=this.isHorizontal(),n=e?this.width:this.height,s=pn(this.options.ticks.minRotation),o=(e?Math.sin(s):Math.cos(s))||.001,r=this._resolveTickFontOptions(0);return Math.ceil(n/Math.min(40,r.lineHeight/o))}getPixelForValue(e){return e===null?NaN:this.getPixelForDecimal((e-this._startValue)/this._valueRange)}getValueForPixel(e){return this._startValue+this.getDecimalForPixel(e)*this._valueRange}},Ti=t=>Math.floor(ss(t)),co=(t,e)=>Math.pow(10,Ti(t)+e);function F$(t){return t/Math.pow(10,Ti(t))===1}function H$(t,e,n){let s=Math.pow(10,n),o=Math.floor(t/s);return Math.ceil(e/s)-o}function kT(t,e){let n=e-t,s=Ti(n);for(;H$(t,e,s)>10;)s++;for(;H$(t,e,s)<10;)s--;return Math.min(s,Ti(t))}function ST(t,{min:e,max:n}){e=Zt(t.min,e);let s=[],o=Ti(e),r=kT(e,n),i=r<0?Math.pow(10,Math.abs(r)):1,a=Math.pow(10,r),l=o>r?Math.pow(10,o):0,c=Math.round((e-l)*i)/i,d=Math.floor((e-l)/a/10)*a*10,u=Math.floor((c-d)/Math.pow(10,r)),p=Zt(t.min,Math.round((l+d+u*Math.pow(10,r))*i)/i);for(;p<n;)s.push({value:p,major:F$(p),significand:u}),u>=10?u=u<15?15:20:u++,u>=20&&(r++,u=2,i=r>=0?1:i),p=Math.round((l+d+u*Math.pow(10,r))*i)/i;let f=Zt(t.max,p);return s.push({value:f,major:F$(f),significand:u}),s}var Tp=class extends uo{static id="logarithmic";static defaults={ticks:{callback:gi.formatters.logarithmic,major:{enabled:!0}}};constructor(e){super(e),this.start=void 0,this.end=void 0,this._startValue=void 0,this._valueRange=0}parse(e,n){let s=gr.prototype.parse.apply(this,[e,n]);if(s===0){this._zero=!0;return}return at(s)&&s>0?s:null}determineDataLimits(){let{min:e,max:n}=this.getMinMax(!0);this.min=at(e)?Math.max(0,e):null,this.max=at(n)?Math.max(0,n):null,this.options.beginAtZero&&(this._zero=!0),this._zero&&this.min!==this._suggestedMin&&!at(this._userMin)&&(this.min=e===co(this.min,0)?co(this.min,-1):co(this.min,0)),this.handleTickRangeOptions()}handleTickRangeOptions(){let{minDefined:e,maxDefined:n}=this.getUserBounds(),s=this.min,o=this.max,r=a=>s=e?s:a,i=a=>o=n?o:a;s===o&&(s<=0?(r(1),i(10)):(r(co(s,-1)),i(co(o,1)))),s<=0&&r(co(o,-1)),o<=0&&i(co(s,1)),this.min=s,this.max=o}buildTicks(){let e=this.options,n={min:this._userMin,max:this._userMax},s=ST(n,this);return e.bounds==="ticks"&&ku(s,this,"value"),e.reverse?(s.reverse(),this.start=this.max,this.end=this.min):(this.start=this.min,this.end=this.max),s}getLabelForValue(e){return e===void 0?"0":cr(e,this.chart.options.locale,this.options.ticks.format)}configure(){let e=this.min;super.configure(),this._startValue=ss(e),this._valueRange=ss(this.max)-ss(e)}getPixelForValue(e){return(e===void 0||e===0)&&(e=this.min),e===null||isNaN(e)?NaN:this.getPixelForDecimal(e===this.min?0:(ss(e)-this._startValue)/this._valueRange)}getValueForPixel(e){let n=this.getDecimalForPixel(e);return Math.pow(10,this._startValue+n*this._valueRange)}};function Pp(t){let e=t.ticks;if(e.display&&t.display){let n=Dt(e.backdropPadding);return $e(e.font&&e.font.size,Qe.font.size)+n.height}return 0}function CT(t,e,n){return n=Ze(n)?n:[n],{w:Ev(t,e.string,n),h:n.length*e.lineHeight}}function W$(t,e,n,s,o){return t===s||t===o?{start:e-n/2,end:e+n/2}:t<s||t>o?{start:e-n,end:e}:{start:e,end:e+n}}function _T(t){let e={l:t.left+t._padding.left,r:t.right-t._padding.right,t:t.top+t._padding.top,b:t.bottom-t._padding.bottom},n=Object.assign({},e),s=[],o=[],r=t._pointLabels.length,i=t.options.pointLabels,a=i.centerPointLabels?Oe/r:0;for(let l=0;l<r;l++){let c=i.setContext(t.getPointLabelContext(l));o[l]=c.padding;let d=t.getPointPosition(l,t.drawingArea+o[l],a),u=ht(c.font),p=CT(t.ctx,u,t._pointLabels[l]);s[l]=p;let f=Et(t.getIndexAngle(l)+a),g=Math.round(Ll(f)),m=W$(g,d.x,p.w,0,180),h=W$(g,d.y,p.h,90,270);MT(n,e,f,m,h)}t.setCenterPoint(e.l-n.l,n.r-e.r,e.t-n.t,n.b-e.b),t._pointLabelItems=PT(t,s,o)}function MT(t,e,n,s,o){let r=Math.abs(Math.sin(n)),i=Math.abs(Math.cos(n)),a=0,l=0;s.start<e.l?(a=(e.l-s.start)/r,t.l=Math.min(t.l,e.l-a)):s.end>e.r&&(a=(s.end-e.r)/r,t.r=Math.max(t.r,e.r+a)),o.start<e.t?(l=(e.t-o.start)/i,t.t=Math.min(t.t,e.t-l)):o.end>e.b&&(l=(o.end-e.b)/i,t.b=Math.max(t.b,e.b+l))}function AT(t,e,n){let s=t.drawingArea,{extra:o,additionalAngle:r,padding:i,size:a}=n,l=t.getPointPosition(e,s+o+i,r),c=Math.round(Ll(Et(l.angle+dt))),d=ET(l.y,a.h,c),u=RT(c),p=LT(l.x,a.w,u);return{visible:!0,x:l.x,y:d,textAlign:u,left:p,top:d,right:p+a.w,bottom:d+a.h}}function TT(t,e){if(!e)return!0;let{left:n,top:s,right:o,bottom:r}=t;return!(Nn({x:n,y:s},e)||Nn({x:n,y:r},e)||Nn({x:o,y:s},e)||Nn({x:o,y:r},e))}function PT(t,e,n){let s=[],o=t._pointLabels.length,r=t.options,{centerPointLabels:i,display:a}=r.pointLabels,l={extra:Pp(r)/2,additionalAngle:i?Oe/o:0},c;for(let d=0;d<o;d++){l.padding=n[d],l.size=e[d];let u=AT(t,d,l);s.push(u),a==="auto"&&(u.visible=TT(u,c),u.visible&&(c=u))}return s}function RT(t){return t===0||t===180?"center":t<180?"left":"right"}function LT(t,e,n){return n==="right"?t-=e:n==="center"&&(t-=e/2),t}function ET(t,e,n){return n===90||n===270?t-=e/2:(n>270||n<90)&&(t-=e),t}function IT(t,e,n){let{left:s,top:o,right:r,bottom:i}=n,{backdropColor:a}=e;if(!_e(a)){let l=Ps(e.borderRadius),c=Dt(e.backdropPadding);t.fillStyle=a;let d=s-c.left,u=o-c.top,p=r-s+c.width,f=i-o+c.height;Object.values(l).some(g=>g!==0)?(t.beginPath(),dr(t,{x:d,y:u,w:p,h:f,radius:l}),t.fill()):t.fillRect(d,u,p,f)}}function DT(t,e){let{ctx:n,options:{pointLabels:s}}=t;for(let o=e-1;o>=0;o--){let r=t._pointLabelItems[o];if(!r.visible)continue;let i=s.setContext(t.getPointLabelContext(o));IT(n,i,r);let a=ht(i.font),{x:l,y:c,textAlign:d}=r;Ts(n,t._pointLabels[o],l,c+a.lineHeight/2,a,{color:i.color,textAlign:d,textBaseline:"middle"})}}function p0(t,e,n,s){let{ctx:o}=t;if(n)o.arc(t.xCenter,t.yCenter,e,0,Ye);else{let r=t.getPointPosition(0,e);o.moveTo(r.x,r.y);for(let i=1;i<s;i++)r=t.getPointPosition(i,e),o.lineTo(r.x,r.y)}}function NT(t,e,n,s,o){let r=t.ctx,i=e.circular,{color:a,lineWidth:l}=e;!i&&!s||!a||!l||n<0||(r.save(),r.strokeStyle=a,r.lineWidth=l,r.setLineDash(o.dash||[]),r.lineDashOffset=o.dashOffset,r.beginPath(),p0(t,n,i,s),r.closePath(),r.stroke(),r.restore())}function OT(t,e,n){return rs(t,{label:n,index:e,type:"pointLabel"})}var Rp=class extends gr{static id="radialLinear";static defaults={display:!0,animate:!0,position:"chartArea",angleLines:{display:!0,lineWidth:1,borderDash:[],borderDashOffset:0},grid:{circular:!1},startAngle:0,ticks:{showLabelBackdrop:!0,callback:gi.formatters.numeric},pointLabels:{backdropColor:void 0,backdropPadding:2,display:!0,font:{size:10},callback(e){return e},padding:5,centerPointLabels:!1}};static defaultRoutes={"angleLines.color":"borderColor","pointLabels.color":"color","ticks.color":"color"};static descriptors={angleLines:{_fallback:"grid"}};constructor(e){super(e),this.xCenter=void 0,this.yCenter=void 0,this.drawingArea=void 0,this._pointLabels=[],this._pointLabelItems=[]}setDimensions(){let e=this._padding=Dt(Pp(this.options)/2),n=this.width=this.maxWidth-e.width,s=this.height=this.maxHeight-e.height;this.xCenter=Math.floor(this.left+n/2+e.left),this.yCenter=Math.floor(this.top+s/2+e.top),this.drawingArea=Math.floor(Math.min(n,s)/2)}determineDataLimits(){let{min:e,max:n}=this.getMinMax(!1);this.min=at(e)&&!isNaN(e)?e:0,this.max=at(n)&&!isNaN(n)?n:0,this.handleTickRangeOptions()}computeTickLimit(){return Math.ceil(this.drawingArea/Pp(this.options))}generateTickLabels(e){gr.prototype.generateTickLabels.call(this,e),this._pointLabels=this.getLabels().map((n,s)=>{let o=qe(this.options.pointLabels.callback,[n,s],this);return o||o===0?o:""}).filter((n,s)=>this.chart.getDataVisibility(s))}fit(){let e=this.options;e.display&&e.pointLabels.display?_T(this):this.setCenterPoint(0,0,0,0)}setCenterPoint(e,n,s,o){this.xCenter+=Math.floor((e-n)/2),this.yCenter+=Math.floor((s-o)/2),this.drawingArea-=Math.min(this.drawingArea/2,Math.max(e,n,s,o))}getIndexAngle(e){let n=Ye/(this._pointLabels.length||1),s=this.options.startAngle||0;return Et(e*n+pn(s))}getDistanceFromCenterForValue(e){if(_e(e))return NaN;let n=this.drawingArea/(this.max-this.min);return this.options.reverse?(this.max-e)*n:(e-this.min)*n}getValueForDistanceFromCenter(e){if(_e(e))return NaN;let n=e/(this.drawingArea/(this.max-this.min));return this.options.reverse?this.max-n:this.min+n}getPointLabelContext(e){let n=this._pointLabels||[];if(e>=0&&e<n.length){let s=n[e];return OT(this.getContext(),e,s)}}getPointPosition(e,n,s=0){let o=this.getIndexAngle(e)-dt+s;return{x:Math.cos(o)*n+this.xCenter,y:Math.sin(o)*n+this.yCenter,angle:o}}getPointPositionForValue(e,n){return this.getPointPosition(e,this.getDistanceFromCenterForValue(n))}getBasePosition(e){return this.getPointPositionForValue(e||0,this.getBaseValue())}getPointLabelPosition(e){let{left:n,top:s,right:o,bottom:r}=this._pointLabelItems[e];return{left:n,top:s,right:o,bottom:r}}drawBackground(){let{backgroundColor:e,grid:{circular:n}}=this.options;if(e){let s=this.ctx;s.save(),s.beginPath(),p0(this,this.getDistanceFromCenterForValue(this._endValue),n,this._pointLabels.length),s.closePath(),s.fillStyle=e,s.fill(),s.restore()}}drawGrid(){let e=this.ctx,n=this.options,{angleLines:s,grid:o,border:r}=n,i=this._pointLabels.length,a,l,c;if(n.pointLabels.display&&DT(this,i),o.display&&this.ticks.forEach((d,u)=>{if(u!==0||u===0&&this.min<0){l=this.getDistanceFromCenterForValue(d.value);let p=this.getContext(u),f=o.setContext(p),g=r.setContext(p);NT(this,f,l,i,g)}}),s.display){for(e.save(),a=i-1;a>=0;a--){let d=s.setContext(this.getPointLabelContext(a)),{color:u,lineWidth:p}=d;!p||!u||(e.lineWidth=p,e.strokeStyle=u,e.setLineDash(d.borderDash),e.lineDashOffset=d.borderDashOffset,l=this.getDistanceFromCenterForValue(n.reverse?this.min:this.max),c=this.getPointPosition(a,l),e.beginPath(),e.moveTo(this.xCenter,this.yCenter),e.lineTo(c.x,c.y),e.stroke())}e.restore()}}drawBorder(){}drawLabels(){let e=this.ctx,n=this.options,s=n.ticks;if(!s.display)return;let o=this.getIndexAngle(0),r,i;e.save(),e.translate(this.xCenter,this.yCenter),e.rotate(o),e.textAlign="center",e.textBaseline="middle",this.ticks.forEach((a,l)=>{if(l===0&&this.min>=0&&!n.reverse)return;let c=s.setContext(this.getContext(l)),d=ht(c.font);if(r=this.getDistanceFromCenterForValue(this.ticks[l].value),c.showLabelBackdrop){e.font=d.string,i=e.measureText(a.label).width,e.fillStyle=c.backdropColor;let u=Dt(c.backdropPadding);e.fillRect(-i/2-u.left,-r-d.size/2-u.top,i+u.width,d.size+u.height)}Ts(e,a.label,0,-r,d,{color:c.color,strokeColor:c.textStrokeColor,strokeWidth:c.textStrokeWidth})}),e.restore()}drawTitle(){}},rc={millisecond:{common:!0,size:1,steps:1e3},second:{common:!0,size:1e3,steps:60},minute:{common:!0,size:6e4,steps:60},hour:{common:!0,size:36e5,steps:24},day:{common:!0,size:864e5,steps:30},week:{common:!1,size:6048e5,steps:4},month:{common:!0,size:2628e6,steps:12},quarter:{common:!1,size:7884e6,steps:4},year:{common:!0,size:3154e7}},Xt=Object.keys(rc);function V$(t,e){return t-e}function j$(t,e){if(_e(e))return null;let n=t._adapter,{parser:s,round:o,isoWeekday:r}=t._parseOpts,i=e;return typeof s=="function"&&(i=s(i)),at(i)||(i=typeof s=="string"?n.parse(i,s):n.parse(i)),i===null?null:(o&&(i=o==="week"&&(io(r)||r===!0)?n.startOf(i,"isoWeek",r):n.startOf(i,o)),+i)}function z$(t,e,n,s){let o=Xt.length;for(let r=Xt.indexOf(t);r<o-1;++r){let i=rc[Xt[r]],a=i.steps?i.steps:Number.MAX_SAFE_INTEGER;if(i.common&&Math.ceil((n-e)/(a*i.size))<=s)return Xt[r]}return Xt[o-1]}function BT(t,e,n,s,o){for(let r=Xt.length-1;r>=Xt.indexOf(n);r--){let i=Xt[r];if(rc[i].common&&t._adapter.diff(o,s,i)>=e-1)return i}return Xt[n?Xt.indexOf(n):0]}function FT(t){for(let e=Xt.indexOf(t)+1,n=Xt.length;e<n;++e)if(rc[Xt[e]].common)return Xt[e]}function U$(t,e,n){if(!n)t[e]=!0;else if(n.length){let{lo:s,hi:o}=El(n,e),r=n[s]>=e?n[s]:n[o];t[r]=!0}}function HT(t,e,n,s){let o=t._adapter,r=+o.startOf(e[0].value,s),i=e[e.length-1].value,a,l;for(a=r;a<=i;a=+o.add(a,1,s))l=n[a],l>=0&&(e[l].major=!0);return e}function K$(t,e,n){let s=[],o={},r=e.length,i,a;for(i=0;i<r;++i)a=e[i],o[a]=i,s.push({value:a,major:!1});return r===0||!n?s:HT(t,s,o,n)}var Pi=class extends uo{static id="time";static defaults={bounds:"data",adapters:{},time:{parser:!1,unit:!1,round:!1,isoWeekday:!1,minUnit:"millisecond",displayFormats:{}},ticks:{source:"auto",callback:!1,major:{enabled:!1}}};constructor(e){super(e),this._cache={data:[],labels:[],all:[]},this._unit="day",this._majorUnit=void 0,this._offsets={},this._normalized=!1,this._parseOpts=void 0}init(e,n={}){let s=e.time||(e.time={}),o=this._adapter=new Q5._date(e.adapters.date);o.init(n),rr(s.displayFormats,o.formats()),this._parseOpts={parser:s.parser,round:s.round,isoWeekday:s.isoWeekday},super.init(e),this._normalized=n.normalized}parse(e,n){return e===void 0?null:j$(this,e)}beforeLayout(){super.beforeLayout(),this._cache={data:[],labels:[],all:[]}}determineDataLimits(){let e=this.options,n=this._adapter,s=e.time.unit||"day",{min:o,max:r,minDefined:i,maxDefined:a}=this.getUserBounds();function l(c){!i&&!isNaN(c.min)&&(o=Math.min(o,c.min)),!a&&!isNaN(c.max)&&(r=Math.max(r,c.max))}(!i||!a)&&(l(this._getLabelBounds()),(e.bounds!=="ticks"||e.ticks.source!=="labels")&&l(this.getMinMax(!1))),o=at(o)&&!isNaN(o)?o:+n.startOf(Date.now(),s),r=at(r)&&!isNaN(r)?r:+n.endOf(Date.now(),s)+1,this.min=Math.min(o,r-1),this.max=Math.max(o+1,r)}_getLabelBounds(){let e=this.getLabelTimestamps(),n=Number.POSITIVE_INFINITY,s=Number.NEGATIVE_INFINITY;return e.length&&(n=e[0],s=e[e.length-1]),{min:n,max:s}}buildTicks(){let e=this.options,n=e.time,s=e.ticks,o=s.source==="labels"?this.getLabelTimestamps():this._generate();e.bounds==="ticks"&&o.length&&(this.min=this._userMin||o[0],this.max=this._userMax||o[o.length-1]);let r=this.min,i=this.max,a=Mv(o,r,i);return this._unit=n.unit||(s.autoSkip?z$(n.minUnit,this.min,this.max,this._getLabelCapacity(r)):BT(this,a.length,n.minUnit,this.min,this.max)),this._majorUnit=!s.major.enabled||this._unit==="year"?void 0:FT(this._unit),this.initOffsets(o),e.reverse&&a.reverse(),K$(this,a,this._majorUnit)}afterAutoSkip(){this.options.offsetAfterAutoskip&&this.initOffsets(this.ticks.map(e=>+e.value))}initOffsets(e=[]){let n=0,s=0,o,r;this.options.offset&&e.length&&(o=this.getDecimalForValue(e[0]),e.length===1?n=1-o:n=(this.getDecimalForValue(e[1])-o)/2,r=this.getDecimalForValue(e[e.length-1]),e.length===1?s=r:s=(r-this.getDecimalForValue(e[e.length-2]))/2);let i=e.length<3?.5:.25;n=vt(n,0,i),s=vt(s,0,i),this._offsets={start:n,end:s,factor:1/(n+1+s)}}_generate(){let e=this._adapter,n=this.min,s=this.max,o=this.options,r=o.time,i=r.unit||z$(r.minUnit,n,s,this._getLabelCapacity(n)),a=$e(o.ticks.stepSize,1),l=i==="week"?r.isoWeekday:!1,c=io(l)||l===!0,d={},u=n,p,f;if(c&&(u=+e.startOf(u,"isoWeek",l)),u=+e.startOf(u,c?"day":i),e.diff(s,n,i)>1e5*a)throw new Error(n+" and "+s+" are too far apart with stepSize of "+a+" "+i);let g=o.ticks.source==="data"&&this.getDataTimestamps();for(p=u,f=0;p<s;p=+e.add(p,a,i),f++)U$(d,p,g);return(p===s||o.bounds==="ticks"||f===1)&&U$(d,p,g),Object.keys(d).sort(V$).map(m=>+m)}getLabelForValue(e){let n=this._adapter,s=this.options.time;return s.tooltipFormat?n.format(e,s.tooltipFormat):n.format(e,s.displayFormats.datetime)}format(e,n){let o=this.options.time.displayFormats,r=this._unit,i=n||o[r];return this._adapter.format(e,i)}_tickFormatFunction(e,n,s,o){let r=this.options,i=r.ticks.callback;if(i)return qe(i,[e,n,s],this);let a=r.time.displayFormats,l=this._unit,c=this._majorUnit,d=l&&a[l],u=c&&a[c],p=s[n],f=c&&u&&p&&p.major;return this._adapter.format(e,o||(f?u:d))}generateTickLabels(e){let n,s,o;for(n=0,s=e.length;n<s;++n)o=e[n],o.label=this._tickFormatFunction(o.value,n,e)}getDecimalForValue(e){return e===null?NaN:(e-this.min)/(this.max-this.min)}getPixelForValue(e){let n=this._offsets,s=this.getDecimalForValue(e);return this.getPixelForDecimal((n.start+s)*n.factor)}getValueForPixel(e){let n=this._offsets,s=this.getDecimalForPixel(e)/n.factor-n.end;return this.min+s*(this.max-this.min)}_getLabelSize(e){let n=this.options.ticks,s=this.ctx.measureText(e).width,o=pn(this.isHorizontal()?n.maxRotation:n.minRotation),r=Math.cos(o),i=Math.sin(o),a=this._resolveTickFontOptions(0).size;return{w:s*r+a*i,h:s*i+a*r}}_getLabelCapacity(e){let n=this.options.time,s=n.displayFormats,o=s[n.unit]||s.millisecond,r=this._tickFormatFunction(e,0,K$(this,[e],this._majorUnit),o),i=this._getLabelSize(r),a=Math.floor(this.isHorizontal()?this.width/i.w:this.height/i.h)-1;return a>0?a:1}getDataTimestamps(){let e=this._cache.data||[],n,s;if(e.length)return e;let o=this.getMatchingVisibleMetas();if(this._normalized&&o.length)return this._cache.data=o[0].controller.getAllParsedValues(this);for(n=0,s=o.length;n<s;++n)e=e.concat(o[n].controller.getAllParsedValues(this));return this._cache.data=this.normalize(e)}getLabelTimestamps(){let e=this._cache.labels||[],n,s;if(e.length)return e;let o=this.getLabels();for(n=0,s=o.length;n<s;++n)e.push(j$(this,o[n]));return this._cache.labels=this._normalized?e:this.normalize(e)}normalize(e){return Mu(e.sort(V$))}};function Gl(t,e,n){let s=0,o=t.length-1,r,i,a,l;n?(e>=t[s].pos&&e<=t[o].pos&&({lo:s,hi:o}=Dn(t,"pos",e)),{pos:r,time:a}=t[s],{pos:i,time:l}=t[o]):(e>=t[s].time&&e<=t[o].time&&({lo:s,hi:o}=Dn(t,"time",e)),{time:r,pos:a}=t[s],{time:i,pos:l}=t[o]);let c=i-r;return c?a+(l-a)*(e-r)/c:a}var Lp=class extends Pi{static id="timeseries";static defaults=Pi.defaults;constructor(e){super(e),this._table=[],this._minPos=void 0,this._tableRange=void 0}initOffsets(){let e=this._getTimestampsForTable(),n=this._table=this.buildLookupTable(e);this._minPos=Gl(n,this.min),this._tableRange=Gl(n,this.max)-this._minPos,super.initOffsets(e)}buildLookupTable(e){let{min:n,max:s}=this,o=[],r=[],i,a,l,c,d;for(i=0,a=e.length;i<a;++i)c=e[i],c>=n&&c<=s&&o.push(c);if(o.length<2)return[{time:n,pos:0},{time:s,pos:1}];for(i=0,a=o.length;i<a;++i)d=o[i+1],l=o[i-1],c=o[i],Math.round((d+l)/2)!==c&&r.push({time:c,pos:i/(a-1)});return r}_generate(){let e=this.min,n=this.max,s=super.getDataTimestamps();return(!s.includes(e)||!s.length)&&s.splice(0,0,e),(!s.includes(n)||s.length===1)&&s.push(n),s.sort((o,r)=>o-r)}_getTimestampsForTable(){let e=this._cache.all||[];if(e.length)return e;let n=this.getDataTimestamps(),s=this.getLabelTimestamps();return n.length&&s.length?e=this.normalize(n.concat(s)):e=n.length?n:s,e=this._cache.all=e,e}getDecimalForValue(e){return(Gl(this._table,e)-this._minPos)/this._tableRange}getValueForPixel(e){let n=this._offsets,s=this.getDecimalForPixel(e)/n.factor-n.end;return Gl(this._table,s*this._tableRange+this._minPos,!0)}},WT=Object.freeze({__proto__:null,CategoryScale:Mp,LinearScale:Ap,LogarithmicScale:Tp,RadialLinearScale:Rp,TimeScale:Pi,TimeSeriesScale:Lp}),f0=[X5,kA,xT,WT];hr.register(...f0);var ls=hr;var Ep=P.bind(T),br="outcomes",Li="tokens",Ip="duration",Es="cost",VT="24h",Dp="7d",jT="30d",zT=[{label:"24h",value:VT},{label:"7d",value:Dp},{label:"30d",value:jT}],UT=[{label:"outcomes",value:br},{label:"tokens",value:Li},{label:"duration",value:Ip},{label:"cost",value:Es}],KT=({trends:t=null,metric:e=br,selectedBucketKey:n=""}={})=>{let s=Array.isArray(t?.points)?t.points:[],o=String(t?.range||Dp),r=s.map(d=>Xn(d.startMs,{range:o,valueType:"epoch-ms"})),i="0.22",a="0.86",l=d=>n&&String(s[d]?.key||"")!==n;if(e===br)return{labels:r,datasets:[{label:"ok",data:s.map(d=>Number(d?.ok||0)),stack:"outcomes",backgroundColor:s.map((d,u)=>`rgba(34,255,170,${l(u)?i:a})`),borderColor:s.map((d,u)=>`rgba(34,255,170,${l(u)?"0.35":"1"})`),borderWidth:1,borderRadius:0,borderSkipped:!1},{label:"error",data:s.map(d=>Number(d?.error||0)),stack:"outcomes",backgroundColor:s.map((d,u)=>`rgba(255,74,138,${l(u)?i:a})`),borderColor:s.map((d,u)=>`rgba(255,74,138,${l(u)?"0.35":"1"})`),borderWidth:1,borderRadius:0,borderSkipped:!1},{label:"skipped",data:s.map(d=>Number(d?.skipped||0)),stack:"outcomes",backgroundColor:s.map((d,u)=>`rgba(255,214,64,${l(u)?i:a})`),borderColor:s.map((d,u)=>`rgba(255,214,64,${l(u)?"0.35":"1"})`),borderWidth:1,borderRadius:0,borderSkipped:!1}]};let c=s.map(d=>Number(e===Li?d?.totalTokens||0:e===Es?d?.totalCost||0:d?.avgDurationMs||0));return{labels:r,datasets:[{label:e===Li?"tokens":e===Es?"cost":"avg duration",data:c,backgroundColor:s.map((d,u)=>e===Li?`rgba(34,211,238,${l(u)?i:"0.72"})`:e===Es?`rgba(167,139,250,${l(u)?i:"0.72"})`:`rgba(148,163,184,${l(u)?i:"0.72"})`),borderColor:s.map((d,u)=>e===Li?`rgba(34,211,238,${l(u)?"0.35":"1"})`:e===Es?`rgba(167,139,250,${l(u)?"0.35":"1"})`:`rgba(148,163,184,${l(u)?"0.35":"1"})`),borderWidth:1,borderRadius:0,borderSkipped:!1}]}},h0=({trends:t=null,range:e=Dp,onChangeRange:n=()=>{},selectedBucketFilter:s=null,onChangeSelectedBucketFilter:o=()=>{}})=>{let r=ee(null),i=ee(null),[a,l]=y(br),c=F(()=>Array.isArray(t?.points)?t.points.map((f,g)=>({...f,key:String(f?.key||`point:${g}:${f?.startMs||0}`)})):[],[t?.points]),d=F(()=>s&&c.find(g=>Number(g.startMs)===Number(s.startMs)&&Number(g.endMs)===Number(s.endMs))?.key||"",[c,s]),u=F(()=>c.some(f=>Number(f?.totalRuns||0)>0||Number(f?.totalTokens||0)>0||Number(f?.totalCost||0)>0||Number(f?.avgDurationMs||0)>0),[c]),p=F(()=>KT({trends:{...t,points:c},metric:a,selectedBucketKey:d}),[a,c,d,t]);return L(()=>{let f=r.current;if(!f||!ls)return;i.current&&(i.current.destroy(),i.current=null);let g=m=>{let h=c[m];return h?{key:h.key,label:Xn(h.startMs,{range:e,valueType:"epoch-ms"}),startMs:Number(h.startMs||0),endMs:Number(h.endMs||0),range:e}:null};return i.current=new ls(f,{type:"bar",data:p,options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},animation:!1,onHover:(m,h)=>{let b=m?.native?.target;!b||!b.style||(b.style.cursor=Array.isArray(h)&&h.length>0?"pointer":"default")},onClick:(m,h)=>{let b=Number(h?.[0]?.index);if(!Number.isFinite(b))return;let x=g(b);if(x){if(x.key===d){o(null);return}o(x)}},scales:{x:{stacked:a===br,grid:{color:"rgba(148,163,184,0.08)"},ticks:{color:"rgba(156,163,175,1)",maxRotation:0,autoSkip:!0}},y:{stacked:a===br,beginAtZero:!0,grid:{color:"rgba(148,163,184,0.12)"},ticks:{precision:a===Es?void 0:0,color:"rgba(156,163,175,1)",callback:m=>{let h=Number(m||0);return a===Es?it(h):a===Ip?h>0?bn(h):"0":Te(h)}}}},plugins:{legend:{position:"bottom",labels:{color:"rgba(209,213,219,1)",boxWidth:10,boxHeight:10}},tooltip:{callbacks:{title:m=>String(m?.[0]?.label||""),label:m=>{let h=Number(m.parsed.y||0);return a===Es?`${m.dataset.label}: ${it(h)}`:a===Ip?`${m.dataset.label}: ${h>0?bn(h):"\u2014"}`:`${m.dataset.label}: ${Te(h)}`},footer:m=>{let h=Number(m?.[0]?.dataIndex),b=c[h];if(!b)return"";let x=`runs: ${Te(b.totalRuns||0)}`,v=`tokens: ${Te(b.totalTokens||0)}`,w=`cost: ${it(b.totalCost||0)}`;return`${x}
${v}
${w}`}}}}}}),()=>{i.current&&(i.current.destroy(),i.current=null)}},[p,a,o,c,e,d,t?.bucket]),Ep`
    <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="card-label card-label-bright">Trends</h3>
        <div class="flex items-center gap-2">
          <${Xe}
            options=${UT}
            value=${a}
            onChange=${l}
          />
          <${Xe}
            options=${zT}
            value=${e}
            onChange=${n}
          />
        </div>
      </div>
      ${u?Ep`
            <div class="h-44">
              <canvas ref=${r}></canvas>
            </div>
          `:Ep`<div class="text-xs text-fg-muted">No run data in this window yet.</div>`}
    </section>
  `};var _t=P.bind(T),GT=(t="")=>{let e=String(t||"").trim().toLowerCase();return e==="ok"?"text-status-success":e==="error"?"text-status-error":e==="skipped"?"text-status-warning":"text-fg-muted"},qT=t=>String(t?.deliveryStatus||"not-requested"),Op=t=>Yn(t,{fallback:"\u2014",valueIsEpochMs:!0}).replace(/\s([AP])M\b/g,(e,n)=>`${String(n||"").toLowerCase()}m`),JT=t=>Yn(t,{fallback:"\u2014",valueIsEpochMs:!0}),Np=(t,e="overview")=>e==="detail"?JT(t):Op(t),ZT=({runEntry:t={},variant:e="overview"})=>{let n=String(t?.status||"unknown"),s=rn(t),o=$n(t),r=String(t?.jobName||"").trim(),i=r.length>0,a=e==="detail";return _t`
    <div class="ac-history-summary-row">
      <span class="inline-flex items-center gap-2 min-w-0">
        ${a?_t`
              <span class="truncate text-xs text-body">
                ${Np(t.ts,e)}
              </span>
            `:i?_t`
                <span class="inline-flex items-center gap-2 min-w-0">
                  <span class="truncate text-xs text-body"
                    >${r}</span
                  >
                  <span class="text-xs text-fg-muted shrink-0">
                    ${Np(t.ts,e)}
                  </span>
                </span>
              `:_t`
                <span class="truncate text-xs text-body">
                  ${t.jobId} -
                  ${Np(t.ts,e)}
                </span>
              `}
      </span>
      <span class="inline-flex items-center gap-3 shrink-0 text-xs">
        <span class=${GT(n)}>${n}</span>
        <span class="text-fg-muted"
          >${bn(t.durationMs)}</span
        >
        <span class="text-fg-muted">${Te(s)} tk</span>
        ${a?_t`<span class="text-fg-muted"
              >${qT(t)}</span
            >`:_t`
              <span class="text-fg-muted">
                ${o==null?"\u2014":`~${it(o)}`}
              </span>
            `}
      </span>
    </div>
  `},YT=(t=[])=>t.reduce((e,n)=>{e.totalTokens+=rn(n);let s=$n(n);return s!=null&&(e.totalCost+=s,e.hasAnyCost=!0),e},{totalTokens:0,totalCost:0,hasAnyCost:!1}),XT=({row:t,rowIndex:e,onSelectJob:n=()=>{}})=>{let s=Array.isArray(t?.entries)?t.entries:[],{totalTokens:o,totalCost:r,hasAnyCost:i}=YT(s),a=`${Op(t.oldestTs)} - ${Op(t.newestTs)}`;return _t`
    <details
      key=${`collapsed:${e}:${t.jobId}`}
      class="ac-history-item"
    >
      <summary class="ac-history-summary">
        <div class="ac-history-summary-row">
          <span class="inline-flex items-center gap-2 min-w-0">
            <span class="ac-history-toggle shrink-0" aria-hidden="true">▸</span>
            <span class="inline-flex items-center gap-2 min-w-0">
              <span class="truncate text-xs text-body">
                ${t.jobName} - ${Te(t.count)} runs
              </span>
              <span class="text-xs text-fg-muted shrink-0"
                >${a}</span
              >
            </span>
          </span>
          <span class="inline-flex items-center gap-3 shrink-0 text-xs">
            <span class="text-fg-muted"
              >${Te(o)} tk</span
            >
            <span class="text-fg-muted">
              ${i?`~${it(r)}`:"\u2014"}
            </span>
          </span>
        </div>
      </summary>
      <div class="border-t border-border pb-2 text-xs">
        ${s.length>0?_t`
              <div class="ac-history-list ac-history-list-tight">
                ${s.map((l,c)=>m0({row:{type:"entry",entry:l},rowIndex:`${e}:${c}`,variant:"overview",onSelectJob:n,showOpenJobButton:!1,itemClassName:"ac-history-item ac-history-item-flat border-b border-border rounded-none"}))}
              </div>
            `:null}
        ${t?.jobId?_t`
              <div class="px-2.5 pt-2 pb-0.5">
                <button
                  type="button"
                  class="text-xs px-2 py-1 rounded border border-border text-fg-muted hover:text-body"
                  onclick=${()=>n(t.jobId)}
                >
                  Open ${t.jobName||t.jobId}
                </button>
              </div>
            `:null}
      </div>
    </details>
  `},m0=({row:t,rowIndex:e,variant:n="overview",onSelectJob:s=()=>{},showOpenJobButton:o=!1,itemClassName:r="ac-history-item"})=>{let i=t?.entry||t||{},a=i?.usage||{},l=Number(a?.input_tokens??a?.inputTokens??0),c=Number(a?.output_tokens??a?.outputTokens??0),d=rn(i),u=$n(i);return _t`
    <details
      key=${`entry:${e}:${i.ts}:${i.jobId||""}`}
      class=${r}
    >
      <summary class="ac-history-summary">
        <div class="inline-flex items-center gap-2 min-w-0 w-full">
          <span class="ac-history-toggle shrink-0" aria-hidden="true">▸</span>
          <div class="min-w-0 flex-1">
            ${ZT({runEntry:i,variant:n})}
          </div>
        </div>
      </summary>
      <div class="ac-history-body space-y-2 text-xs">
        ${i.summary?_t`<div>
              <span class="text-fg-muted">Summary:</span> ${i.summary}
            </div>`:null}
        ${i.error?_t`<div class="text-status-error">
              <span class="text-fg-muted">Error:</span> ${i.error}
            </div>`:null}
        <div class="ac-surface-inset rounded-lg p-2.5 space-y-1.5">
          <div class="text-fg-muted">
            Model:
            <span class="text-body font-mono"
              >${i.model||"\u2014"}</span
            >
          </div>
          <div class="text-fg-muted">
            Session:
            <span class="text-body font-mono"
              >${i.sessionKey||"\u2014"}</span
            >
          </div>
          <div class="text-fg-muted">
            Tokens in:
            <span class="text-body"
              >${Te(l)}</span
            >
          </div>
          <div class="text-fg-muted">
            Tokens out:
            <span class="text-body"
              >${Te(c)}</span
            >
          </div>
          <div class="text-fg-muted">
            Total tokens:
            <span class="text-body">${Te(d)}</span>
          </div>
          <div class="text-fg-muted">
            Total cost:
            <span class="text-body">
              ${u==null?"\u2014":`~${it(u)}`}
            </span>
          </div>
        </div>
        ${o&&i?.jobId?_t`
              <div>
                <button
                  type="button"
                  class="text-xs px-2 py-1 rounded border border-border text-fg-muted hover:text-body"
                  onclick=${()=>s(i.jobId)}
                >
                  Open ${i.jobName||i.jobId}
                </button>
              </div>
            `:null}
      </div>
    </details>
  `},ic=({entryCountLabel:t="",primaryFilterOptions:e=[],primaryFilterValue:n="all",onChangePrimaryFilter:s=()=>{},secondaryFilterOptions:o=[],secondaryFilterValue:r="all",onChangeSecondaryFilter:i=()=>{},activeFilterLabel:a="",onClearActiveFilter:l=()=>{},rows:c=[],emptyText:d="No runs found.",variant:u="overview",onSelectJob:p=()=>{},showOpenJobButton:f=!1,footer:g=null})=>_t`
  <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
    <div class="flex items-start justify-between gap-3">
      <div class="inline-flex items-center gap-3">
        <h3 class="card-label card-label-bright">Recent runs</h3>
        <div class="text-xs text-fg-muted">${t}</div>
      </div>
      <div class="shrink-0 inline-flex items-center gap-2">
        <${Xe}
          options=${e}
          value=${n}
          onChange=${s}
        />
        ${Array.isArray(o)&&o.length>0?_t`
              <${Xe}
                options=${o}
                value=${r}
                onChange=${i}
              />
            `:null}
      </div>
    </div>
    ${a?_t`
          <div class="flex items-center">
            <span
              class="inline-flex items-center gap-1.5 text-xs pl-2.5 pr-2 py-1 rounded-full border border-border text-body bg-field"
            >
              Filtered to ${a}
              <button
                type="button"
                class="text-fg-muted hover:text-body leading-none"
                onclick=${l}
                aria-label="Clear trend filter"
              >
                ×
              </button>
            </span>
          </div>
        `:null}
    ${c.length===0?_t`<div class="text-sm text-fg-muted">${d}</div>`:_t`
          <div class="ac-history-list">
            ${c.map((m,h)=>m?.type==="collapsed-group"?XT({row:m,rowIndex:h,onSelectJob:p}):m0({row:m,rowIndex:h,variant:u,onSelectJob:p,showOpenJobButton:f}))}
          </div>
        `}
    ${g}
  </section>
`;var g0=P.bind(T),b0="cronPromptEditorHeightPx",QT=280,eP=180,x0=t=>{let e=Number(t),n=Number.isFinite(e)?Math.round(e):QT;return Math.max(eP,n)},tP=t=>{if(!t)return 0;let e=Number.parseFloat(window.getComputedStyle(t).height||"0");return Number.isFinite(e)?e:0},y0=({promptValue:t="",savedPromptValue:e="",onChangePrompt:n=()=>{},onSaveChanges:s=()=>{}})=>{let o=ee(null),r=ee(null),i=ee(null),a=ee([]),l=ee(null),c=ee([]),[d,u]=y(()=>{let w=Fe();return x0(w?.[b0])}),p=ml(t),f=!gl({contentLength:t.length,lineCount:p,charThreshold:pl,lineThreshold:fl}),g=F(()=>f?dl(t,"markdown"):[],[t,f]),m=Math.max(p,Array.isArray(g)?g.length:0),h=F(()=>Array.from({length:m},(w,$)=>$+1),[m]),b=t!==e;bl({enabled:f,syncKey:`${t.length}:${g.length}`,editorLineNumberRowRefs:a,editorHighlightLineRefs:c});let x=w=>{let $=w.currentTarget.scrollTop;i.current&&(i.current.scrollTop=$),l.current&&(l.current.scrollTop=$)},v=w=>{if((w.metaKey||w.ctrlKey)&&w.key.toLowerCase()==="s"&&(w.preventDefault(),s()),w.key==="Tab"){w.preventDefault();let $=r.current;if(!$)return;let S=$.selectionStart,C=$.selectionEnd,_=`${t.slice(0,S)}  ${t.slice(C)}`;n(_),window.requestAnimationFrame(()=>{$.selectionStart=S+2,$.selectionEnd=S+2})}};return L(()=>{let w=o.current;if(!w||typeof ResizeObserver>"u")return()=>{};let $=null,S=new ResizeObserver(C=>{let _=C?.[0],k=x0(tP(_?.target));u(A=>Math.abs(A-k)>=1?k:A),$&&window.clearTimeout($),$=window.setTimeout(()=>{let A=Fe();A[b0]=k,Ct(A)},120)});return S.observe(w),()=>{S.disconnect(),$&&window.clearTimeout($)}},[]),g0`
    <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="card-label card-label-bright inline-flex items-center gap-1.5">
          Prompt
          ${b?g0`<span class="file-viewer-dirty-dot"></span>`:null}
        </h3>
      </div>
      <div
        class="cron-prompt-editor-shell"
        ref=${o}
        style=${{height:`${d}px`}}
      >
        <${Yo}
          editorShellClassName="file-viewer-editor-shell"
          editorLineNumbers=${h}
          editorLineNumbersRef=${i}
          editorLineNumberRowRefs=${a}
          shouldUseHighlightedEditor=${f}
          highlightedEditorLines=${g}
          editorHighlightRef=${l}
          editorHighlightLineRefs=${c}
          editorTextareaRef=${r}
          renderContent=${t}
          handleContentInput=${w=>n(w.target.value)}
          handleEditorKeyDown=${v}
          handleEditorScroll=${x}
          handleEditorSelectionChange=${()=>{}}
          isEditBlocked=${!1}
          isPreviewOnly=${!1}
        />
      </div>
    </section>
  `};var ac=P.bind(T),Ei="ac-surface-inset rounded-lg p-2.5 space-y-1.5",nP=[{label:"main",value:"main"},{label:"isolated",value:"isolated"}],sP=[{label:"now",value:"now"},{label:"next-heartbeat",value:"next-heartbeat"}],Bp="__none__",v0=(t,e)=>t.getFullYear()===e.getFullYear()&&t.getMonth()===e.getMonth()&&t.getDate()===e.getDate(),oP=t=>t.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}).replace(/\s*([AP])M$/i,(e,n)=>`${String(n||"").toLowerCase()}m`).replace(/\s+/g,""),rP=t=>{let e=Number(t||0);if(!Number.isFinite(e)||e<=0)return"\u2014";let n=new Date(e);if(Number.isNaN(n.getTime()))return"\u2014";let s=new Date,o=new Date(s);o.setDate(s.getDate()+1);let r=v0(n,s),i=v0(n,o),a=oP(n);return r?a:i?`Tomorrow ${a}`:`${n.toLocaleDateString()} ${a}`},$0=({job:t=null,routingDraft:e=null,onChangeRoutingDraft:n=()=>{},destinationSessionKey:s="",onChangeDestinationSessionKey:o=()=>{},deliverySessions:r=[],loadingDeliverySessions:i=!1,deliverySessionsError:a="",savingChanges:l=!1,togglingJobEnabled:c=!1,onToggleEnabled:d=()=>{},onRunNow:u=()=>{},runningJob:p=!1,hasUnsavedChanges:f=!1})=>{if(!t)return null;let g=String(e?.sessionTarget||t?.sessionTarget||"main"),m=String(e?.wakeMode||t?.wakeMode||"now"),h=String(e?.deliveryMode||t?.delivery?.mode||"none"),b=F(()=>{let v=new Set,w=[],$=String(s||"").trim(),S=!1;if((Array.isArray(r)?r:[]).forEach(C=>{let _=String(C?.key||"").trim();if(!_)return;_===$&&(S=!0);let A=String(C?.label||C?.key||"Session").trim().toLowerCase();v.has(A)||(v.add(A),w.push(C))}),!S&&$){let C=(Array.isArray(r)?r:[]).find(_=>String(_?.key||"").trim()===$);C&&w.unshift(C)}return w},[r,s]),x=h==="announce"&&String(s||"").trim()?String(s||""):Bp;return ac`
    <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-3">
        <div class="text-xs text-fg-muted">ID: <code>${t.id}</code></div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class=${Ei}>
          <div class="text-fg-muted">Schedule</div>
          <div class="text-body font-mono">
            ${Qo(t.schedule,{includeTimeZoneWhenDifferent:!0})}
          </div>
        </div>
        <div class=${Ei}>
          <div class="text-fg-muted">Next run</div>
          <div class="text-body font-mono">
            ${rP(t?.state?.nextRunAtMs)}
            <span class="text-fg-muted">
              ${` (${Gy(t?.state?.nextRunAtMs)})`}
            </span>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-2 text-xs">
        <div class=${Ei}>
          <div class="text-fg-muted">Session target</div>
          <div class="pt-1">
            <${Xe}
              options=${nP}
              value=${g}
              onChange=${v=>n((w={})=>({...w,sessionTarget:String(v||"main")}))}
            />
          </div>
        </div>
        <div class=${Ei}>
          <div class="text-fg-muted">Wake mode</div>
          <div class="pt-1">
            <${Xe}
              options=${sP}
              value=${m}
              onChange=${v=>n((w={})=>({...w,wakeMode:String(v||"now")}))}
            />
          </div>
        </div>
        <div class=${Ei}>
          <div class="text-fg-muted">Delivery</div>
          <div class="pt-1">
            <select
              value=${x}
              onInput=${v=>{let w=String(v.currentTarget?.value||"");if(!w||w===Bp){n(($={})=>({...$,deliveryMode:"none",deliveryChannel:"",deliveryTo:""})),o("");return}o(w),n(($={})=>({...$,deliveryMode:"announce"}))}}
              disabled=${l}
              class="w-full bg-field border border-border rounded-lg px-2 py-1.5 text-[11px] text-body focus:border-fg-muted"
            >
              <option value=${Bp}>None</option>
              ${b.map(v=>ac`
                  <option value=${String(v?.key||"")}>
                    ${String(v?.label||v?.key||"Session")}
                  </option>
                `)}
            </select>
          </div>
          ${i?ac`<div class="text-[11px] text-fg-muted pt-1">
                Loading delivery sessions...
              </div>`:null}
          ${a?ac`<div class="text-[11px] text-status-error-muted pt-1">
                ${a}
              </div>`:null}
        </div>
      </div>
      <div class="flex items-center justify-between gap-3">
        <${vn}
          checked=${t.enabled!==!1}
          disabled=${c||l}
          onChange=${d}
          label=${t.enabled===!1?"Disabled":"Enabled"}
        />
        <${Z}
          onClick=${u}
          loading=${p}
          disabled=${f||l}
          tone="secondary"
          size="sm"
          idleLabel="Run now"
          loadingLabel="Running..."
        />
      </div>
    </section>
  `};var Fp=P.bind(T),iP=[{label:"all",value:"all"},{label:"ok",value:"ok"},{label:"error",value:"error"},{label:"skipped",value:"skipped"}],w0=({job:t=null,runEntries:e=[],filteredRunEntries:n=[],runTotal:s=0,runHasMore:o=!1,loadingMoreRuns:r=!1,runStatusFilter:i="all",onSetRunStatusFilter:a=()=>{},onLoadMoreRuns:l=()=>{},onRunNow:c=()=>{},runningJob:d=!1,onToggleEnabled:u=()=>{},togglingJobEnabled:p=!1,usage:f=null,jobTrends:g=null,jobTrendRange:m="7d",selectedJobTrendBucketFilter:h=null,usageDays:b=30,onSetUsageDays:x=()=>{},onSetJobTrendRange:v=()=>{},onSetSelectedJobTrendBucketFilter:w=()=>{},promptValue:$="",savedPromptValue:S="",onChangePrompt:C=()=>{},onSaveChanges:_=()=>{},savingChanges:k=!1,routingDraft:A=null,onChangeRoutingDraft:O=()=>{},deliverySessions:D=[],loadingDeliverySessions:z=!1,deliverySessionsError:E="",destinationSessionKey:M="",onChangeDestinationSessionKey:R=()=>{}})=>{if(!t)return Fp`
      <div class="h-full flex items-center justify-center text-sm text-fg-muted">
        Select a cron job to view details.
      </div>
    `;let U=F(()=>{let W=String(A?.sessionTarget||t?.sessionTarget||"main"),G=String(A?.wakeMode||t?.wakeMode||"now"),se=String(A?.deliveryMode||t?.delivery?.mode||"none"),K=String(t?.sessionTarget||"main"),j=String(t?.wakeMode||"now"),X=String(t?.delivery?.mode||"none");return W!==K||G!==j||se!==X},[t,A?.deliveryMode,A?.sessionTarget,A?.wakeMode])||$!==S;return Fp`
    <div class="cron-detail-scroll">
      <div class="cron-detail-content">
        <${$0}
          job=${t}
          routingDraft=${A}
          onChangeRoutingDraft=${O}
          destinationSessionKey=${M}
          onChangeDestinationSessionKey=${R}
          deliverySessions=${D}
          loadingDeliverySessions=${z}
          deliverySessionsError=${E}
          savingChanges=${k}
          togglingJobEnabled=${p}
          onToggleEnabled=${u}
          onRunNow=${c}
          runningJob=${d}
          hasUnsavedChanges=${U}
        />

        <${y0}
          promptValue=${$}
          savedPromptValue=${S}
          onChangePrompt=${C}
          onSaveChanges=${_}
        />

        <${tv}
          usage=${f}
          usageDays=${b}
          onSetUsageDays=${x}
        />
        <${h0}
          trends=${g}
          range=${m}
          onChangeRange=${v}
          selectedBucketFilter=${h}
          onChangeSelectedBucketFilter=${w}
        />

        <${ic}
          entryCountLabel=${`${Te(h?n.length:s)} entries`}
          primaryFilterOptions=${iP}
          primaryFilterValue=${i}
          onChangePrimaryFilter=${a}
          activeFilterLabel=${h?.label||""}
          onClearActiveFilter=${()=>w(null)}
          rows=${h?n:e}
          variant="detail"
          footer=${o?Fp`
                <div class="pt-2">
                  <${Z}
                    onClick=${l}
                    loading=${r}
                    tone="secondary"
                    size="sm"
                    idleLabel="Load More"
                    loadingLabel="Loading..."
                  />
                </div>
              `:null}
        />
      </div>
    </div>
  `};var Vn=(t,e=0)=>{let n=Number(t);return Number.isFinite(n)?n:e},k0=t=>{let e=new Date(Vn(t,Date.now()));return e.setMinutes(0,0,0),e.getTime()},Wp=t=>{let e=new Date(Vn(t,Date.now()));return e.setHours(0,0,0,0),e.getTime()},C0=(t={})=>{let n=String(t?.expr||t?.cron||t?.cronExpr||"").trim().split(/\s+/);if(n.length<5)return null;let[s,o,r,i,a]=n;return{minuteField:s,hourField:o,dayOfMonthField:r,monthField:i,dayOfWeekField:a}},aP=(t="",e=0,n=0)=>{if(/^\d+$/.test(t)){let r=Number.parseInt(t,10);return Number.isFinite(r)&&r>=e&&r<=n?[r]:[]}let s=t.match(/^(\d+)-(\d+)$/);if(s){let r=Number.parseInt(s[1],10),i=Number.parseInt(s[2],10);if(!Number.isFinite(r)||!Number.isFinite(i))return[];let a=Math.max(e,Math.min(n,r)),l=Math.max(e,Math.min(n,i));return a>l?[]:Array.from({length:l-a+1},(c,d)=>a+d)}let o=t.match(/^\*\/(\d+)$/);if(o){let r=Number.parseInt(o[1],10);if(!Number.isFinite(r)||r<=0)return[];let i=[];for(let a=e;a<=n;a+=r)i.push(a);return i}return t==="*"?Array.from({length:n-e+1},(r,i)=>e+i):[]},po=(t="",e=0,n=0)=>{let s=String(t||"").trim();if(!s)return new Set;let r=s.split(",").map(i=>i.trim()).filter(Boolean).flatMap(i=>aP(i,e,n));return new Set(r)},lP=(t=null)=>t?{minuteSet:po(t.minuteField,0,59),hourSet:po(t.hourField,0,23),dayOfMonthSet:po(t.dayOfMonthField,1,31),monthSet:po(t.monthField,1,12),dayOfWeekSet:po(t.dayOfWeekField,0,7)}:null,cP=(t,e=null)=>{if(!e)return!1;let{minuteSet:n,hourSet:s,dayOfMonthSet:o,monthSet:r,dayOfWeekSet:i}=e,a=t.getMinutes(),l=t.getHours(),c=t.getDate(),d=t.getMonth()+1,u=t.getDay(),p=u===0?[0,7]:[u],f=n.size===0||n.has(a),g=s.size===0||s.has(l),m=o.size===0||o.has(c),h=r.size===0||r.has(d),b=i.size===0||p.some(x=>i.has(x));return f&&g&&m&&h&&b},Hp=t=>{let e=new Date(t),n=e.getFullYear(),s=String(e.getMonth()+1).padStart(2,"0"),o=String(e.getDate()).padStart(2,"0");return`${n}-${s}-${o}`},dP=({nowMs:t=Date.now(),pastDays:e=3,futureDays:n=3}={})=>{let s=Vn(t,Date.now()),o=Math.max(0,Number.parseInt(String(e),10)||3),r=Math.max(0,Number.parseInt(String(n),10)||3),i=Wp(s-o*864e5),a=Wp(s+r*864e5)+864e5-1;return{nowMs:s,rangeStartMs:i,rangeEndMs:a,dayCount:o+r+1}},S0=({jobId:t="",scheduledAtMs:e=0}={})=>`${String(t||"")}:${Vn(e,0)}`,uP=(t={})=>{if(String(t?.schedule?.kind||"").trim().toLowerCase()!=="cron")return!1;let n=C0(t?.schedule||{});if(!n||n.dayOfMonthField!=="*"||n.monthField!=="*")return!1;let s=String(n.minuteField||"").trim().match(/^\*\/(\d+)$/),o=po(n.minuteField,0,59),r=po(n.hourField,0,23),i=r.size>0?r.size:24,a=o.size>0?o.size:1;if(s){let l=Number.parseInt(s[1],10);return!Number.isFinite(l)||l<=0?!1:l<=30&&i>=4}return a>=3&&i>=4},_0=(t=[])=>{let e=[],n=[];return t.forEach(s=>{String(s?.schedule?.kind||"").trim().toLowerCase()==="every"||uP(s)?e.push(s):n.push(s)}),{repeatingJobs:e,scheduledJobs:n}},M0=({jobs:t=[],nowMs:e=Date.now(),pastDays:n=3,futureDays:s=3}={})=>{let o=dP({nowMs:e,pastDays:n,futureDays:s}),r=[],i=Array.from({length:o.dayCount},(a,l)=>{let c=Wp(o.rangeStartMs+l*864e5);return{dayStartMs:c,dayKey:Hp(c),label:new Date(c).toLocaleDateString([],{weekday:"short",month:"numeric",day:"numeric"})}});return t.forEach(a=>{let l=String(a?.schedule?.kind||"").trim().toLowerCase();if(l==="every")return;if(l==="at"){let u=Vn(a?.schedule?.at,0);if(u<o.rangeStartMs||u>o.rangeEndMs)return;let p=k0(u);r.push({key:S0({jobId:a.id,scheduledAtMs:u}),jobId:String(a?.id||""),jobName:String(a?.name||a?.id||""),scheduledAtMs:u,hourBucketMs:p,dayKey:Hp(p),hourOfDay:new Date(p).getHours()});return}let c=C0(a?.schedule||{});if(!c)return;let d=lP(c);if(d)for(let u=o.rangeStartMs;u<=o.rangeEndMs;u+=6e4){let p=new Date(u);if(!cP(p,d))continue;let f=k0(u);r.push({key:S0({jobId:a.id,scheduledAtMs:u}),jobId:String(a?.id||""),jobName:String(a?.name||a?.id||""),scheduledAtMs:u,hourBucketMs:f,dayKey:Hp(u),hourOfDay:p.getHours()})}}),r.sort((a,l)=>a.scheduledAtMs-l.scheduledAtMs),{range:o,days:i,slots:r}},pP=(t="")=>{let e=String(t||"").trim().toLowerCase();return e==="ok"||e==="error"||e==="skipped"?e:""},A0=({slots:t=[],bulkRunsByJobId:e={},nowMs:n=Date.now(),toleranceMs:s=27e5}={})=>{let o={},r=Vn(n,Date.now()),i=Math.max(0,Vn(s,45*6e4)),a={};Object.entries(e||{}).forEach(([c,d])=>{let p=(Array.isArray(d?.entries)?d.entries:[]).map(f=>({ts:Vn(f?.ts,0),status:pP(f?.status)})).filter(f=>f.ts>0&&f.status).sort((f,g)=>f.ts-g.ts);a[c]=p});let l={};return t.forEach(c=>{if(c.scheduledAtMs>r)return;let d=String(c.jobId||""),u=a[d]||[];if(u.length===0)return;let p=l[d]||new Set;l[d]=p;let f=null,g=Number.MAX_SAFE_INTEGER;u.forEach(m=>{if(p.has(m.ts))return;let h=Math.abs(m.ts-c.scheduledAtMs);h>i||h<g&&(g=h,f=m)}),f&&(p.add(f.ts),o[c.key]=f.status)}),o};var T0=({slots:t=[],nowMs:e=Date.now(),windowMs:n=864e5,limit:s=12}={})=>{let o=Vn(e,Date.now()),r=o+Vn(n,864e5);return t.filter(i=>i.scheduledAtMs>o&&i.scheduledAtMs<=r).sort((i,a)=>i.scheduledAtMs-a.scheduledAtMs).slice(0,s)};var $t=P.bind(T),fP=t=>{let e=new Date;return e.setHours(t,0,0,0),e.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})},P0=(t,e)=>`${String(t||"")}:${e}`,hP=t=>{let e=new Date(t),n=e.getFullYear(),s=String(e.getMonth()+1).padStart(2,"0"),o=String(e.getDate()).padStart(2,"0");return`${n}-${s}-${o}`},Vp=({isPast:t=!1,mappedStatus:e="",tokenTier:n="low"}={})=>{let s={unknown:"cron-calendar-slot-tier-unknown",low:"cron-calendar-slot-tier-low",medium:"cron-calendar-slot-tier-medium",high:"cron-calendar-slot-tier-high","very-high":"cron-calendar-slot-tier-very-high",disabled:"cron-calendar-slot-tier-disabled"},o=s[n]||s.low;return t?e==="ok"?`${o} cron-calendar-slot-ok`:e==="error"?`${o} cron-calendar-slot-error`:e==="skipped"?`${o} cron-calendar-slot-skipped`:`${o} cron-calendar-slot-past`:`${o} cron-calendar-slot-upcoming`},R0=()=>$t`
  <div class="cron-calendar-legend">
    <span class="cron-calendar-legend-label">Token intensity</span>
    <span class="cron-calendar-legend-pill cron-calendar-slot-tier-low"
      >Low</span
    >
    <span class="cron-calendar-legend-pill cron-calendar-slot-tier-medium"
      >Medium</span
    >
    <span class="cron-calendar-legend-pill cron-calendar-slot-tier-high"
      >High</span
    >
    <span class="cron-calendar-legend-pill cron-calendar-slot-tier-very-high"
      >Very high</span
    >
  </div>
`,mP=60*1e3,gP=10080*60*1e3,bP=2700*1e3,xP="unknown",yP=t=>new Date(t).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}),vP=({runsByJobId:t={},nowMs:e=Date.now()}={})=>{let n=Number(e||Date.now())-gP;return Object.entries(t||{}).reduce((s,[o,r])=>{let a=(Array.isArray(r?.entries)?r.entries:[]).filter(u=>{let p=Number(u?.ts||0);return Number.isFinite(p)&&p>=n&&p<=e}),l=a.length,c=a.reduce((u,p)=>u+Number(rn(p)||0),0),d=a.reduce((u,p)=>{let f=$n(p);return u+Number(f??0)},0);return s[String(o||"")]={runCount:l,totalTokens:c,totalCost:d,avgTokensPerRun:l>0?Math.round(c/l):0,avgCostPerRun:l>0?d/l:0},s},{})},$P=({slots:t=[],runsByJobId:e={},nowMs:n=Date.now()}={})=>{let s={},o={},r=Object.entries(e||{}).reduce((i,[a,l])=>{let d=(Array.isArray(l?.entries)?l.entries:[]).map(u=>({...u,ts:Number(u?.ts||0)})).filter(u=>Number.isFinite(u.ts)&&u.ts>0).sort((u,p)=>u.ts-p.ts);return i[String(a||"")]=d,i},{});return t.forEach(i=>{if(Number(i?.scheduledAtMs||0)>n)return;let a=String(i?.jobId||""),l=r[a]||[];if(l.length===0)return;let c=o[a]||new Set;o[a]=c;let d=null,u=Number.MAX_SAFE_INTEGER;l.forEach(p=>{if(c.has(p.ts))return;let f=Math.abs(p.ts-Number(i?.scheduledAtMs||0));f>bP||f<u&&(u=f,d=p)}),d&&(c.add(d.ts),s[String(i?.key||"")]=d)}),s},wP=(t=[])=>{let e=t.map(s=>Number(s||0)).filter(s=>Number.isFinite(s)&&s>0).sort((s,o)=>s-o);if(e.length===0)return null;let n=(s=0)=>{let o=Math.min(e.length-1,Math.floor((e.length-1)*s));return e[Math.max(0,o)]};return{q1:n(.25),q2:n(.5),p90:n(.9)}},jp=({enabled:t=!0,tokenValue:e=0,thresholds:n=null}={})=>{if(!t)return"disabled";let s=Number(e||0);return!Number.isFinite(s)||s<=0||!n?xP:s<=n.q1?"low":s<=n.q2?"medium":s<=n.p90?"high":"very-high"},zp=({jobName:t="",job:e=null,runSummary7d:n={},slotRun:s=null,latestRun:o=null,scheduledAtMs:r=0,scheduledStatus:i="",nowMs:a=Date.now()}={})=>{let l=Number(r||0)>0&&Number(r||0)<=a,c=Number(n?.runCount||0),d=Number(n?.avgTokensPerRun||0),u=Number(n?.avgCostPerRun||0),p=rn(s||{}),f=$n(s||{}),g=String(s?.status||"").trim().toLowerCase(),m=[String(t||"Job")];if(l?(m.push(`Run tokens: ${s?Te(p):"\u2014"}`),m.push(`Run cost: ${f==null?"\u2014":it(f)}`),m.push(`Run status: ${g||i||"unknown"}`),s?.ts&&m.push(`Run time: ${new Date(Number(s.ts||0)).toLocaleString()}`)):(m.push(`Avg tokens/run (last 7d): ${c>0?Te(d):"\u2014"}`),m.push(`Avg cost/run (last 7d): ${c>0?it(u):"\u2014"}`),m.push(`Runs (last 7d): ${c>0?Te(c):"none"}`)),!l&&o?.status?m.push(`Latest run: ${o.status} (${new Date(Number(o.ts||0)).toLocaleString()})`):l||m.push("Latest run: none"),Number(e?.state?.runningAtMs||0)>0&&m.push(`Current run: active (${new Date(Number(e.state.runningAtMs)).toLocaleString()})`),r>0){let h=new Date(r).toLocaleString(),b=i||(r<=Date.now()?"past":"upcoming");m.push(`Slot: ${b} (${h})`)}return m.join(`
`)},L0=({jobs:t=[],runsByJobId:e={},onSelectJob:n=()=>{}})=>{let[s,o]=y(!1),[r,i]=y(!1),[a,l]=y(()=>Date.now());L(()=>{let M=window.setInterval(()=>{l(Date.now())},mP);return()=>{window.clearInterval(M)}},[]);let c=hP(a),d=F(()=>new Date(a),[a]),u=d.getHours(),p=d.getMinutes()/60,{repeatingJobs:f,scheduledJobs:g}=F(()=>_0(t),[t]),m=F(()=>M0({jobs:g,nowMs:a}),[g,a]),h=F(()=>A0({slots:m.slots,bulkRunsByJobId:e,nowMs:a}),[m.slots,e,a]),b=F(()=>t.reduce((M,R)=>{let B=String(R?.id||"");return B&&(M[B]=R),M},{}),[t]),x=F(()=>Object.entries(e||{}).reduce((M,[R,B])=>{let U=(Array.isArray(B?.entries)?B.entries:[]).filter(W=>Number(W?.ts||0)>0).sort((W,G)=>Number(G?.ts||0)-Number(W?.ts||0))[0];return M[R]=U||null,M},{}),[e]),v=F(()=>vP({runsByJobId:e,nowMs:a}),[e,a]),w=F(()=>$P({slots:m.slots,runsByJobId:e,nowMs:a}),[m.slots,e,a]),$=F(()=>{let M=[];return m.slots.forEach(R=>{let B=b[R.jobId]||null;if(!B||B.enabled===!1)return;if(Number(R?.scheduledAtMs||0)<=a){let W=rn(w[R.key]||{});W>0&&M.push(W);return}let U=Number(v[R.jobId]?.avgTokensPerRun||0);U>0&&M.push(U)}),f.forEach(R=>{let B=String(R?.id||""),I=Number(v[B]?.avgTokensPerRun||0);I>0&&M.push(I)}),wP(M)},[b,a,f,w,v,m.slots]),S=q((M=null)=>{let R=String(M?.jobId||""),I=(b[R]||null)?.enabled!==!1;if(Number(M?.scheduledAtMs||0)<=a){let G=rn(w[String(M?.key||"")]||{});return jp({enabled:I,tokenValue:G,thresholds:$})}let W=Number(v[R]?.avgTokensPerRun||0);return jp({enabled:I,tokenValue:W,thresholds:$})},[b,a,w,v,$]),C=q((M="")=>{let R=b[M]||null;return jp({enabled:R?.enabled!==!1,tokenValue:Number(v[M]?.avgTokensPerRun||0),thresholds:$})},[b,v,$]),_=F(()=>T0({slots:m.slots,nowMs:a,limit:3}),[m.slots,a]),k=F(()=>{let M=a+864e5;return f.map(R=>{let B=String(R?.id||""),I=Number(R?.state?.nextRunAtMs||0);return!B||!Number.isFinite(I)||I<=a||I>M?null:{key:`noisy:${B}:${I}`,jobId:B,jobName:String(R?.name||B),scheduledAtMs:I}}).filter(Boolean).sort((R,B)=>R.scheduledAtMs-B.scheduledAtMs)},[f,a]),A=F(()=>r?[..._,...k].sort((M,R)=>Number(M?.scheduledAtMs||0)-Number(R?.scheduledAtMs||0)):_,[k,r,_]),O=F(()=>[...new Set(m.slots.map(R=>R.hourOfDay))].sort((R,B)=>R-B),[m.slots]),D=F(()=>m.slots.reduce((M,R)=>{let B=P0(R.dayKey,R.hourOfDay),I=M[B]||[];return I.push(R),M[B]=I,M},{}),[m.slots]),z=()=>$t`
      <div class="space-y-2">
        ${A.length===0?$t`<div class="text-xs text-fg-muted py-1">
              No upcoming jobs in the next 24 hours.
            </div>`:$t`
              <div class="cron-calendar-compact-list">
                ${A.map(M=>{let R=v[M.jobId]||{},B=Number(R?.avgTokensPerRun||0),I=Number(R?.avgCostPerRun||0),U=B>0||I>0?`Est. ${B>0?`${Te(B)} tk`:"\u2014 tk"} \xB7 ${I>0?it(I):"\u2014"}`:"Est. \u2014",W=zp({jobName:M.jobName,job:b[M.jobId]||null,runSummary7d:v[M.jobId]||{},slotRun:w[M.key]||null,latestRun:x[M.jobId],scheduledAtMs:M.scheduledAtMs,nowMs:a});return $t`
                    <${yt}
                      text=${W}
                      widthClass="w-72"
                      tooltipClassName="whitespace-pre-line"
                      triggerClassName="block w-full"
                    >
                      <button
                        key=${M.key}
                        type="button"
                        class=${`cron-calendar-compact-row ${Vp({isPast:!1,mappedStatus:"",tokenTier:C(M.jobId)})}`}
                        onClick=${()=>n(M.jobId)}
                      >
                        <span class="cron-calendar-compact-main">
                          <span class="cron-calendar-compact-time"
                            >${yP(M.scheduledAtMs)}</span
                          >
                          <span class="cron-calendar-compact-name truncate"
                            >${M.jobName}</span
                          >
                        </span>
                        <span class="cron-calendar-compact-estimate"
                          >${U}</span
                        >
                      </button>
                    </${yt}>
                  `})}
              </div>
            `}
        <div class="flex items-center justify-between mt-2">
          ${k.length>0?$t`
                  <button
                    type="button"
                    class="ac-btn-ghost text-xs px-2.5 py-1 rounded-lg"
                    onClick=${()=>i(M=>!M)}
                  >
                    ${r?"Show fewer":`+${k.length} noisy runs`}
                  </button>
                `:$t`<span></span>`}
          <${R0} />
        </div>
      </div>
    `,E=()=>$t`
    <div class="space-y-3">
      ${O.length===0?$t`<div class="text-sm text-fg-muted">
            No scheduled jobs in this rolling window.
          </div>`:$t`
            <div class="cron-calendar-grid-wrap">
              <div class="cron-calendar-grid-header">
                <div class="cron-calendar-hour-cell cron-calendar-grid-corner"></div>
                ${m.days.map(M=>$t`
                    <div
                      key=${M.dayKey}
                      class=${`cron-calendar-day-header ${M.dayKey===c?"is-today":""}`}
                    >
                      ${M.label}
                    </div>
                  `)}
              </div>
              <div class="cron-calendar-grid-body">
                ${O.map(M=>$t`
                    <div key=${M} class="cron-calendar-grid-row">
                      <div class="cron-calendar-hour-cell">
                        ${fP(M)}
                      </div>
                      ${m.days.map(R=>{let B=P0(R.dayKey,M),I=D[B]||[],U=I.slice(0,3),W=Math.max(0,I.length-U.length);return $t`
                          <div
                            key=${B}
                            class=${`cron-calendar-grid-cell ${R.dayKey===c?"is-today":""}`}
                          >
                            ${R.dayKey===c&&M===u?$t`
                                  <div
                                    class="cron-calendar-now-indicator"
                                    style=${`top: ${Math.max(0,Math.min(100,p*100))}%;`}
                                    aria-hidden="true"
                                  >
                                    <span class="cron-calendar-now-indicator-dot"></span>
                                  </div>
                                `:null}
                            ${U.map(G=>{let se=h[G.key]||"",K=G.scheduledAtMs<=a,j=S(G),X=zp({jobName:G.jobName,job:b[G.jobId]||null,runSummary7d:v[G.jobId]||{},slotRun:w[G.key]||null,latestRun:x[G.jobId],scheduledAtMs:G.scheduledAtMs,scheduledStatus:se,nowMs:a});return $t`
                              <${yt}
                                text=${X}
                                widthClass="w-72"
                                tooltipClassName="whitespace-pre-line"
                                triggerClassName="inline-flex w-full"
                              >
                                <div
                                  key=${G.key}
                                  class=${`cron-calendar-slot-chip ${Vp({isPast:K,mappedStatus:se,tokenTier:j})}`}
                                  role="button"
                                  tabindex="0"
                                  onClick=${()=>n(G.jobId)}
                                  onKeyDown=${de=>{de.key!=="Enter"&&de.key!==" "||(de.preventDefault(),n(G.jobId))}}
                                >
                                  <span class="truncate">${G.jobName}</span>
                                </div>
                              </${yt}>
                            `})}
                            ${W>0?$t`<div class="cron-calendar-slot-overflow">
                                  +${W} more
                                </div>`:null}
                          </div>
                        `})}
                    </div>
                  `)}
              </div>
            </div>
          `}
      ${f.length>0?$t`
            <div class="cron-calendar-repeating-strip">
              <div class="text-xs text-fg-muted">Repeating</div>
              <div class="cron-calendar-repeating-list">
                ${f.map(M=>{let R=String(M?.id||""),B=Number(v[R]?.avgTokensPerRun||0),I=zp({jobName:M.name||M.id,job:M,runSummary7d:v[R]||{},slotRun:null,latestRun:x[R],nowMs:a});return $t`
                    <${yt}
                      text=${I}
                      widthClass="w-72"
                      tooltipClassName="whitespace-pre-line"
                      triggerClassName="inline-flex max-w-full"
                    >
                      <div
                        class=${`cron-calendar-repeating-pill ${Vp({isPast:!1,mappedStatus:"",tokenTier:C(R)})}`}
                        role="button"
                        tabindex="0"
                        onClick=${()=>n(R)}
                        onKeyDown=${U=>{U.key!=="Enter"&&U.key!==" "||(U.preventDefault(),n(R))}}
                      >
                        <span class="truncate">${M.name||M.id}</span>
                        <span class="text-[10px] opacity-80">
                          ${Qo(M.schedule,{includeTimeZoneWhenDifferent:!0})}
                          ${B>0?` | avg ${Te(B)} tk`:""}
                        </span>
                      </div>
                    </${yt}>
                  `})}
              </div>
            </div>
          `:null}
    </div>
  `;return $t`
    <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="card-label card-label-bright">Up next</h3>
        <button
          type="button"
          class="ac-btn-secondary text-xs px-3 py-1.5 rounded-lg"
          onClick=${()=>o(!0)}
        >
          Open calendar
        </button>
      </div>

      ${z()}
    </section>
    <${De}
      visible=${s}
      onClose=${()=>o(!1)}
      panelClassName="cron-calendar-lightbox-panel"
    >
      <div class="flex items-center justify-between gap-2">
        <h3 class="card-label cron-calendar-title">Calendar</h3>
        <button
          type="button"
          class="cron-calendar-lightbox-close"
          onClick=${()=>o(!1)}
          aria-label="Close expanded calendar"
        >
          <${nt} className="w-4 h-4" />
        </button>
      </div>
      <div class="flex items-center justify-center">
        <${R0} />
      </div>
      <div class="cron-calendar-lightbox-body">
        ${E()}
      </div>
    </${De}>
  `};var kP=P.bind(T),Ni="24h",xr="7d",Oi="30d",SP=[{label:"24h",value:Ni},{label:"7d",value:xr},{label:"30d",value:Oi}],Ii="outcomes",Di="tokens",lc="cost",CP=[{label:"outcomes",value:Ii},{label:"tokens",value:Di},{label:"cost",value:lc}],Up=t=>{let e=new Date(t);return e.setHours(0,0,0,0),e.getTime()},Kp=(t,e=0)=>{let n=new Date(t);return n.setDate(n.getDate()+Number(e||0)),n.getTime()},_P=(t=xr)=>t===Ni?{bucketCount:24,bucketMs:3600*1e3,formatLabel:e=>Xn(e,{range:Ni,valueType:"epoch-ms"}),showLabel:(e,n,s)=>n%3===0||n===s-1,alignToLocalDay:!1}:t===Oi?{bucketCount:30,bucketMs:1440*60*1e3,formatLabel:e=>Xn(e,{range:Oi,valueType:"epoch-ms"}),showLabel:(e,n,s)=>n%5===0||n===s-1,alignToLocalDay:!0}:{bucketCount:7,bucketMs:1440*60*1e3,formatLabel:e=>Xn(e,{range:xr,valueType:"epoch-ms"}),showLabel:()=>!0,alignToLocalDay:!0},MP=({bulkRunsByJobId:t={},nowMs:e=Date.now(),range:n=xr}={})=>{let s=_P(n),o=Number.isFinite(Number(e))?Number(e):Date.now(),r=s.alignToLocalDay?Kp(Up(o),-(s.bucketCount-1)):o-s.bucketCount*s.bucketMs,i=Array.from({length:s.bucketCount},(d,u)=>{let p=s.alignToLocalDay?Kp(r,u):r+u*s.bucketMs,f=u===s.bucketCount-1?o:s.alignToLocalDay?Kp(r,u+1):r+(u+1)*s.bucketMs;return{key:`trend-point-${u}`,startMs:p,endMs:f,ok:0,error:0,skipped:0,totalTokens:0,totalCost:0,costCount:0}}),a=s.alignToLocalDay?new Map(i.map((d,u)=>[Up(d.startMs),u])):null,l=i[0]?.startMs||r;Object.values(t||{}).forEach(d=>{(Array.isArray(d?.entries)?d.entries:[]).forEach(p=>{let f=Number(p?.ts||0);if(!Number.isFinite(f)||f<l||f>o)return;let g=String(p?.status||"").trim().toLowerCase();if(!["ok","error","skipped"].includes(g))return;let m=s.alignToLocalDay?a?.get(Up(f)):Math.floor((f-l)/s.bucketMs);if(!Number.isFinite(Number(m))||m<0||m>=s.bucketCount)return;i[m][g]+=1,i[m].totalTokens+=rn(p);let h=$n(p);h!=null&&(i[m].totalCost+=h,i[m].costCount+=1)})});let c=i.map((d,u)=>{let p=d.ok+d.error+d.skipped;return{...d,total:p,label:s.formatLabel(d.startMs),showLabel:s.showLabel(d,u,i.length)}});return{points:c,maxTotal:Math.max(1,...c.map(d=>d.total))}},E0=({bulkRunsByJobId:t={},initialRange:e=Ni,selectedBucketFilter:n=null,onBucketFilterChange:s=()=>{}})=>{let o=ee(null),r=ee(null),[i,a]=y(Ii),[l,c]=y(e===Oi?Oi:e===xr?xr:Ni),d=F(()=>MP({bulkRunsByJobId:t,nowMs:Date.now(),range:l}),[t,l]);L(()=>{s(null)},[l,s]);let u=F(()=>!n||n.range!==l?"":d.points.find(m=>Number(m.startMs)===Number(n.startMs)&&Number(m.endMs)===Number(n.endMs))?.key||"",[l,n,d.points]),p=F(()=>d.points.findIndex(g=>g.key===u),[u,d.points]),f=F(()=>{let g="0.22",m="0.86",h=v=>p>=0&&p!==v,b=d.points.map(v=>v.showLabel?v.label:"");return i===Ii?{labels:b,datasets:[{label:"ok",data:d.points.map(v=>Number(v.ok||0)),stack:"outcomes",backgroundColor:d.points.map((v,w)=>`rgba(34,255,170,${h(w)?g:m})`),borderColor:d.points.map((v,w)=>`rgba(34,255,170,${h(w)?"0.35":"1"})`),borderWidth:1,borderRadius:0,borderSkipped:!1},{label:"error",data:d.points.map(v=>Number(v.error||0)),stack:"outcomes",backgroundColor:d.points.map((v,w)=>`rgba(255,74,138,${h(w)?g:m})`),borderColor:d.points.map((v,w)=>`rgba(255,74,138,${h(w)?"0.35":"1"})`),borderWidth:1,borderRadius:0,borderSkipped:!1},{label:"skipped",data:d.points.map(v=>Number(v.skipped||0)),stack:"outcomes",backgroundColor:d.points.map((v,w)=>`rgba(255,214,64,${h(w)?g:m})`),borderColor:d.points.map((v,w)=>`rgba(255,214,64,${h(w)?"0.35":"1"})`),borderWidth:1,borderRadius:0,borderSkipped:!1}]}:{labels:b,datasets:[{label:i===Di?"tokens":"cost",data:d.points.map(v=>Number(i===Di?v.totalTokens||0:v.totalCost||0)),backgroundColor:d.points.map((v,w)=>i===Di?`rgba(34,211,238,${h(w)?g:"0.72"})`:`rgba(167,139,250,${h(w)?g:"0.72"})`),borderColor:d.points.map((v,w)=>i===Di?`rgba(34,211,238,${h(w)?"0.35":"1"})`:`rgba(167,139,250,${h(w)?"0.35":"1"})`),borderWidth:1,borderRadius:0,borderSkipped:!1}]}},[i,p,d.points]);return L(()=>{let g=o.current;if(!g||!ls)return;r.current&&(r.current.destroy(),r.current=null);let m=h=>{let b=d.points[h];return b?{key:b.key,label:b.label,range:l,startMs:Number(b.startMs||0),endMs:Number(b.endMs||0)}:null};return r.current=new ls(g,{type:"bar",data:f,options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},animation:!1,onHover:(h,b)=>{let x=h?.native?.target;!x||!x.style||(x.style.cursor=Array.isArray(b)&&b.length>0?"pointer":"default")},onClick:(h,b)=>{let x=Number(b?.[0]?.index);if(!Number.isFinite(x))return;let v=m(x);if(v){if(v.key===u){s(null);return}s(v)}},scales:{x:{stacked:i===Ii,grid:{color:"rgba(148,163,184,0.08)"},ticks:{color:"rgba(156,163,175,1)",maxRotation:0,autoSkip:!1}},y:{stacked:i===Ii,beginAtZero:!0,grid:{color:"rgba(148,163,184,0.12)"},ticks:{precision:i===lc?void 0:0,color:"rgba(156,163,175,1)",callback:h=>i===lc?it(Number(h||0)):Te(Number(h||0))}}},plugins:{legend:{position:"bottom",labels:{color:"rgba(209,213,219,1)",boxWidth:10,boxHeight:10}},tooltip:{callbacks:{title:h=>String(h?.[0]?.label||""),label:h=>{let b=Number(h.parsed.y||0);return i===lc?`${h.dataset.label}: ${it(b)}`:`${h.dataset.label}: ${Te(b)}`},footer:h=>{let b=Number(h?.[0]?.dataIndex),x=d.points[b];if(!x)return"";let v=x.costCount>0?`~${it(x.totalCost)}`:"\u2014",w=Te(x.totalTokens||0);return`runs: ${x.total}
tokens: ${w}
cost: ${v}`}}}}}}),()=>{r.current&&(r.current.destroy(),r.current=null)}},[f,i,s,l,u,d.points]),kP`
    <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="card-label cron-calendar-title">Trends</h3>
        <div class="flex items-center gap-2">
          <${Xe}
            options=${CP}
            value=${i}
            onChange=${a}
          />
          <${Xe}
            options=${SP}
            value=${l}
            onChange=${c}
          />
        </div>
      </div>
      <div class="h-40">
        <canvas ref=${o}></canvas>
      </div>
    </section>
  `};var cc=P.bind(T),D0="24h",Bi="7d",N0="30d",AP=[{label:"24h",value:D0},{label:"7d",value:Bi},{label:"30d",value:N0}],I0={[D0]:1440*60*1e3,[Bi]:10080*60*1e3,[N0]:720*60*60*1e3},Gp=3,TP={"Token hungry":"warning","Potentially wasteful":"danger","Most expensive":"accent"},PP=10,RP=1e5,LP=3,qp=(t=0)=>{let e=Number(t||0);return`${Te(e)} ${e===1?"run":"runs"}`},EP=(t=null)=>String(t?.delivery?.mode||t?.deliveryMode||"none").trim().toLowerCase(),Jp=(t=[],e=[])=>[...t].sort((n,s)=>{for(let o of e){let r=Number(o(n)||0),i=Number(o(s)||0);if(r!==i)return i-r}return String(n?.jobName||"").localeCompare(String(s?.jobName||""))}),IP=({jobs:t=[],bulkRunsByJobId:e={},rangeValue:n=Bi})=>{let s=Date.now(),o=Number(I0[n]||I0[Bi]),r=s-o,i=t.reduce((a,l)=>{let c=String(l?.id||"");return c&&(a[c]={jobId:c,jobName:String(l?.name||c),runCount:0,totalTokens:0,totalCost:0,hasCostData:!1,hasDelivery:EP(l)!=="none"}),a},{});return Object.entries(e||{}).forEach(([a,l])=>{let c=String(a||"");if(!c)return;i[c]||(i[c]={jobId:c,jobName:c,runCount:0,totalTokens:0,totalCost:0,hasCostData:!1,hasDelivery:!1}),(Array.isArray(l?.entries)?l.entries:[]).forEach(u=>{let p=Number(u?.ts||0);if(!Number.isFinite(p)||p<r||p>s)return;i[c].runCount+=1,i[c].totalTokens+=Number(rn(u)||0);let f=$n(u);f!=null&&(i[c].hasCostData=!0,i[c].totalCost+=Number(f||0))})}),Object.values(i).map(a=>({...a,avgTokensPerRun:a.runCount>0?Math.round(a.totalTokens/a.runCount):0,avgCostPerRun:a.runCount>0?a.totalCost/a.runCount:0}))},DP=({title:t="",rows:e=[],onSelectJob:n=()=>{}})=>{let s=TP[t]||"neutral",o=e[0],r=e.slice(1);return cc`
    <div class="rounded-lg border border-border bg-field px-3 py-2 space-y-1.5">
      <button
        type="button"
        class="w-full text-left hover:brightness-110 transition"
        onClick=${()=>n(o.jobId)}
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="text-sm text-bright truncate">${o.jobName}</div>
            <div class="text-xs text-fg-muted truncate mt-1">
              ${`${o.primaryLabel} \xB7 ${o.secondaryLabel}`}
            </div>
          </div>
          <div class="shrink-0 inline-flex items-center gap-1.5">
            <${ae} tone=${s}>${t}</${ae}>
          </div>
        </div>
      </button>
      ${r.length>0?cc`
              <details class="group">
                <summary
                  class="list-none cursor-pointer text-[11px] text-fg-muted hover:text-body"
                >
                  Show more
                </summary>
                <div class="mt-1.5 divide-y divide-border">
                  ${r.map((i,a)=>cc`
                      <button
                        key=${`${t}:${i.jobId}`}
                        type="button"
                        class="w-full text-left py-2 hover:brightness-110 transition"
                        onClick=${()=>n(i.jobId)}
                      >
                        <div class="flex items-start justify-between gap-3">
                          <div class="min-w-0">
                            <div class="text-sm text-body truncate">
                              ${i.jobName}
                            </div>
                            <div
                              class="text-[11px] text-fg-muted truncate mt-1"
                            >
                              ${`${i.primaryLabel} \xB7 ${i.secondaryLabel}`}
                            </div>
                          </div>
                          <div
                            class="text-[11px] uppercase tracking-wide text-fg-muted"
                          >
                            #${a+2}
                          </div>
                        </div>
                      </button>
                    `)}
                </div>
              </details>
            `:null}
    </div>
  `},O0=({jobs:t=[],bulkRunsByJobId:e={},onSelectJob:n=()=>{}})=>{let[s,o]=y(Bi),r=F(()=>IP({jobs:t,bulkRunsByJobId:e,rangeValue:s}),[e,t,s]),i=F(()=>Jp(r.filter(d=>d.runCount>=LP&&d.avgTokensPerRun>=RP),[d=>d.avgTokensPerRun,d=>d.totalTokens]).slice(0,Gp).map(d=>({...d,primaryLabel:`${Te(d.avgTokensPerRun)} avg tokens/run`,secondaryLabel:`${Te(d.totalTokens)} total tokens \xB7 ${qp(d.runCount)}`})),[r]),a=F(()=>Jp(r.filter(d=>d.runCount>=PP&&d.hasDelivery===!1&&(d.totalTokens>0||d.totalCost>0)),[d=>d.totalTokens,d=>d.runCount]).slice(0,Gp).map(d=>({...d,primaryLabel:`${qp(d.runCount)} with no delivery`,secondaryLabel:`${Te(d.totalTokens)} total tokens${d.hasCostData?` \xB7 ${it(d.totalCost)}`:""}`})),[r]),l=F(()=>Jp(r.filter(d=>d.runCount>0&&d.totalCost>0),[d=>d.totalCost,d=>d.avgCostPerRun]).slice(0,Gp).map(d=>({...d,primaryLabel:`${it(d.totalCost)} total estimated cost`,secondaryLabel:`${it(d.avgCostPerRun)} avg/run \xB7 ${qp(d.runCount)}`})),[r]),c=[{title:"Token hungry",rows:i},{title:"Potentially wasteful",rows:a},{title:"Most expensive",rows:l}].filter(d=>Array.isArray(d.rows)&&d.rows.length>0);return c.length===0?null:cc`
    <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="card-label cron-calendar-title">Insights</h3>
        <${Xe}
          options=${AP}
          value=${s}
          onChange=${o}
        />
      </div>

      <div class="grid grid-cols-1 gap-2">
        ${c.map(d=>DP({title:d.title,rows:d.rows,onSelectJob:n}))}
      </div>
    </section>
  `};var NP=P.bind(T),cs=({title:t="",value:e="\u2014",toneClassName:n="",valueClassName:s="text-lg font-semibold text-body",monospace:o=!1}={})=>NP`
  <div class="bg-surface border border-border rounded-xl p-4">
    <h3 class="card-label text-xs">${t}</h3>
    <div class=${`${s} mt-2 ${o?"font-mono":""} ${n}`}>${e}</div>
  </div>
`;var dc=P.bind(T),OP=100,B0=20,BP=2,Fi="24h",Hi="7d",Wi="30d",Zp="trendStart",Yp="trendEnd",Xp="trendRange",Qp="trendLabel",FP=[{label:"all",value:"all"},{label:"ok",value:"ok"},{label:"error",value:"error"},{label:"skipped",value:"skipped"}],HP=t=>t==="error"?"border-status-error-border bg-status-error-bg text-status-error":t==="warning"?"border-status-warning-border bg-status-warning-bg text-status-warning":"border-border bg-field text-body",WP=(t=[])=>{let e=t.filter(r=>r?.tone==="error").length,n=t.filter(r=>r?.tone==="warning").length;if(e+n<=0)return"No warnings currently need your attention";let o=[];return e>0&&o.push(`${e} error${e===1?"":"s"}`),n>0&&o.push(`${n} warning${n===1?"":"s"}`),`${o.join(" and ")} may need your attention`},VP=({bulkRunsByJobId:t={},jobs:e=[],limit:n=0}={})=>{let s=e.reduce((o,r)=>{let i=String(r?.id||"");return i&&(o[i]=String(r?.name||i)),o},{});return Object.entries(t||{}).flatMap(([o,r])=>(Array.isArray(r?.entries)?r.entries:[]).map(a=>({...a,jobId:String(o||""),jobName:s[o]||String(o||"")}))).filter(o=>Number(o?.ts||0)>0).sort((o,r)=>Number(r?.ts||0)-Number(o?.ts||0)).slice(0,Number(n||0)>0?Number(n||0):void 0)},jP=(t=[])=>{let e=[],n=0;for(;n<t.length&&e.length<B0;){let s=t[n],o=n+1;for(;o<t.length&&String(t[o]?.jobId||"")===String(s?.jobId||"");)o+=1;let r=t.slice(n,o);if(r.length>=BP){let i=r.reduce((a,l)=>{let c=String(l?.status||"unknown");return a[c]=Number(a[c]||0)+1,a},{});e.push({type:"collapsed-group",jobId:String(s?.jobId||""),jobName:String(s?.jobName||s?.jobId||""),count:r.length,newestTs:Number(r[0]?.ts||0),oldestTs:Number(r[r.length-1]?.ts||0),statusCounts:i,entries:r}),n=o;continue}for(let i of r){if(e.length>=B0)break;e.push({type:"entry",entry:i})}n=o}return e},F0=()=>{let e=String(window.location.hash||"").replace(/^#/,"")||"/cron",[n,s=""]=e.split("?");return{pathPart:n||"/cron",params:new URLSearchParams(s)}},zP=()=>{let{params:t}=F0(),e=Number(t.get(Zp)||0),n=Number(t.get(Yp)||0),s=String(t.get(Xp)||Fi),o=String(t.get(Qp)||""),r=s===Fi||s===Hi||s===Wi;return!Number.isFinite(e)||!Number.isFinite(n)||n<=e?null:{startMs:e,endMs:n,range:r?s:Fi,label:o||"selected period"}},UP=(t=null)=>{let{pathPart:e,params:n}=F0();t?(n.set(Zp,String(Number(t.startMs||0))),n.set(Yp,String(Number(t.endMs||0))),n.set(Xp,t.range===Wi?Wi:t.range===Hi?Hi:Fi),n.set(Qp,String(t.label||""))):(n.delete(Zp),n.delete(Yp),n.delete(Xp),n.delete(Qp));let s=n.toString(),o=s?`#${e}?${s}`:`#${e}`,r=`${window.location.pathname}${window.location.search}${o}`;window.history.replaceState(window.history.state,"",r)},H0=({jobs:t=[],bulkUsageByJobId:e={},bulkRunsByJobId:n={},onSelectJob:s=()=>{}})=>{let[o,r]=y("all"),[i,a]=y(()=>zP()),l=t.filter(x=>x.enabled!==!1).length,c=t.length-l,d=Yy(t),u=Zy(t,n),p=F(()=>VP({bulkRunsByJobId:n,jobs:t}),[n,t]),f=F(()=>p.slice(0,OP),[p]),g=F(()=>{if(!i)return f;let x=Number(i?.startMs||0),v=Number(i?.endMs||0);return!Number.isFinite(x)||!Number.isFinite(v)||v<=x?f:p.filter(w=>{let $=Number(w?.ts||0);return Number.isFinite($)&&$>=x&&$<v})},[p,f,i]),m=F(()=>g.filter(x=>o==="all"?!0:String(x?.status||"").trim().toLowerCase()===o),[o,g]),h=F(()=>jP(m),[m]),b=i?.range===Wi?Wi:i?.range===Hi?Hi:Fi;return L(()=>{UP(i)},[i]),dc`
    <div class="cron-detail-scroll">
      <div class="cron-detail-content">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <${cs}
            title="Total jobs"
            value=${t.length}
            monospace=${!0}
          />
          <${cs}
            title="Enabled"
            value=${l}
            monospace=${!0}
          />
          <${cs}
            title="Disabled"
            value=${c}
            monospace=${!0}
          />
        </div>

        <section class="bg-surface border border-border rounded-xl px-4 py-3">
          <details class="group">
            <summary class="list-none cursor-pointer">
              <div class="flex items-center justify-between gap-2">
                <div class="inline-flex items-center gap-2 min-w-0">
                  <${gb}
                    className="w-4 h-4 text-status-warning shrink-0"
                  />
                  <div class="text-xs text-status-warning truncate">
                    ${WP(u)}
                  </div>
                </div>
                <span
                  class="text-fg-muted text-xs transition-transform group-open:rotate-90"
                  >▸</span
                >
              </div>
            </summary>
            <div class="mt-3">
              ${u.length===0?dc`<div class="text-xs text-fg-muted">
                    No warnings right now.
                  </div>`:dc`
                    <div class="space-y-2">
                      ${u.map((x,v)=>dc`
                          <div
                            key=${`warning:${v}`}
                            class=${`rounded-xl border p-3 text-xs ${HP(x.tone)} ${x?.jobId?"cursor-pointer hover:brightness-110":""}`}
                            role=${x?.jobId?"button":null}
                            tabindex=${x?.jobId?"0":null}
                            onclick=${()=>{x?.jobId&&s(x.jobId)}}
                            onKeyDown=${w=>{x?.jobId&&(w.key!=="Enter"&&w.key!==" "||(w.preventDefault(),s(x.jobId)))}}
                          >
                            <div class="font-medium">${x.title}</div>
                            <div class="mt-1 opacity-90">${x.body}</div>
                          </div>
                        `)}
                    </div>
                  `}
            </div>
          </details>
        </section>

        <${L0}
          jobs=${t}
          usageByJobId=${e}
          runsByJobId=${n}
          onSelectJob=${s}
        />

        <${O0}
          jobs=${t}
          bulkRunsByJobId=${n}
          onSelectJob=${s}
        />

        <${E0}
          bulkRunsByJobId=${n}
          initialRange=${b}
          selectedBucketFilter=${i}
          onBucketFilterChange=${a}
        />

        <${ic}
          entryCountLabel=${`${Te(m.length)} entries`}
          primaryFilterOptions=${FP}
          primaryFilterValue=${o}
          onChangePrimaryFilter=${r}
          activeFilterLabel=${i?.label||""}
          onClearActiveFilter=${()=>a(null)}
          rows=${h}
          variant="overview"
          onSelectJob=${s}
          showOpenJobButton=${!0}
        />
      </div>
    </div>
  `};var ef=(t="")=>String(t||"").trim(),Je=(t=null)=>ef(t?.key||t?.sessionKey||""),tf=(t="")=>{let n=ef(t).match(/^agent:([^:]+):/);return String(n?.[1]||"").trim()},uc=(t="")=>{let e=ef(t).toLowerCase();return e.includes(":direct:")||e.includes(":group:")},pc=t=>!!(String(t?.replyChannel||"").trim()&&String(t?.replyTo||"").trim())||uc(Je(t)),W0={destination:0,other:1},V0=(t=null)=>uc(Je(t))?W0.destination:W0.other,j0=(t=[])=>[...Array.isArray(t)?t:[]].sort((e,n)=>{let s=V0(e)-V0(n);if(s!==0)return s;let o=Number(n?.updatedAt||0)-Number(e?.updatedAt||0);return o!==0?o:Je(e).localeCompare(Je(n))}),z0=(t=null)=>{let e=String(t?.replyChannel||"").trim(),n=String(t?.replyTo||"").trim();if(!e||!n)return null;let s=tf(Je(t));return{channel:e,to:n,...s?{agentId:s}:{}}};var KP=()=>{try{let t=localStorage.getItem(Ad);if(!t)return[];let e=JSON.parse(t);return Array.isArray(e)?e:[]}catch{return[]}},GP=t=>{try{localStorage.setItem(Ad,JSON.stringify(t))}catch{}},U0=()=>{try{return localStorage.getItem(Td)||""}catch{return""}},qP=t=>{try{localStorage.setItem(Td,String(t||""))}catch{}},nf=(t,e)=>{if(e){let n=t.find(s=>Je(s)===e);if(n)return n}return t.find(n=>Je(n).toLowerCase()==="agent:main:main")||t.find(n=>uc(Je(n)))||t[0]||null},yr=({enabled:t=!1,filter:e}={})=>{let[n,s]=y([]),[o,r]=y(""),[i,a]=y(!1),[l,c]=y(""),d=q(f=>{let g=String(f||"");r(g),qP(g)},[]);L(()=>{if(!t)return;let f=!0,g=KP(),m=U0();if(g.length>0){s(g);let b=nf(g,m);r(Je(b))}return(async()=>{try{g.length===0&&a(!0),c("");let b=await Xh();if(!f)return;let x=Array.isArray(b?.sessions)?b.sessions:[];if(s(x),GP(x),g.length===0||!m){let v=nf(x,m);r(Je(v))}}catch(b){if(!f)return;g.length===0&&(s([]),r(""),c(b.message||"Could not load agent sessions"))}finally{f&&a(!1)}})(),()=>{f=!1}},[t]);let u=F(()=>j0(e?n.filter(e):n),[n,e]);L(()=>{if(!t)return;if(u.length===0){o&&r("");return}if(u.some(m=>Je(m)===String(o||"")))return;let g=nf(u,U0());r(Je(g))},[t,u,o]);let p=F(()=>u.find(f=>Je(f)===o)||null,[u,o]);return{sessions:u,selectedSessionKey:o,setSelectedSessionKey:d,selectedSession:p,loading:i,error:l}};var Is="__none__",Ds=({enabled:t=!1,resetKey:e=""}={})=>{let[n,s]=y(""),[o,r]=y(!1),{sessions:i,selectedSessionKey:a,setSelectedSessionKey:l,loading:c,error:d}=yr({enabled:t,filter:pc});L(()=>{t&&(s(""),r(!1))},[t,e]);let u=F(()=>{let h=i.find(b=>Je(b)===String(a||"").trim());return String(Je(h)||Je(i[0])).trim()},[i,a]),p=o?n:u,f=F(()=>i.find(h=>Je(h)===String(p||"").trim())||null,[p,i]),g=F(()=>z0(f),[f]),m=q(h=>{let b=String(h||"");s(b),r(!0),l(b)},[l]);return{sessions:i,loading:c,error:d,destinationSessionKey:p,setDestinationSessionKey:m,selectedDestinationSession:f,selectedDestination:g}};var JP=372,ZP=220,YP=480,sf="cronListPanelWidthPx",K0=25,XP=30,QP=30,G0="24h",q0="7d",J0="30d",ds={sessionTarget:"main",wakeMode:"now",deliveryMode:"none",deliveryChannel:"",deliveryTo:""},of=(t=null)=>({sessionTarget:String(t?.sessionTarget||ds.sessionTarget),wakeMode:String(t?.wakeMode||ds.wakeMode),deliveryMode:String(t?.delivery?.mode||ds.deliveryMode),deliveryChannel:String(t?.delivery?.channel||""),deliveryTo:String(t?.delivery?.to||"")}),Z0=t=>Math.max(ZP,Math.min(YP,t)),e3=(t="")=>String(t||"").trim()||ws,Y0=({jobId:t="",onSetLocation:e=()=>{}}={})=>{let n=e3(t),s=n===ws?"":n,o=ee(null),[r,i]=y(()=>{let H=Fe();return Number.isFinite(H?.[sf])?Z0(H[sf]):JP}),[a,l]=y(!1),[c,d]=y("all"),[u,p]=y([]),[f,g]=y(!1),[m,h]=y(0),[b,x]=y(0),[v,w]=y(!1),[$,S]=y(""),[C,_]=y(""),[k,A]=y(!1),[O,D]=y(!1),[z,E]=y(!1),[M,R]=y(ds),[B,I]=y(30),[U,W]=y(q0),[G,se]=y(null),{sessions:K,loading:j,error:X,destinationSessionKey:de,setDestinationSessionKey:le,selectedDestination:ie}=Ds({enabled:!!s,resetKey:String(s||"")}),ne=Re(()=>vm({sortBy:"nextRunAtMs",sortDir:"asc"}),15e3),xe=Re($m,3e4),he=Re(()=>s?cd(s,{limit:K0,offset:0,status:c,sortDir:"desc"}):Promise.resolve({ok:!0,runs:{entries:[],hasMore:!1,nextOffset:0}}),1e4,{enabled:!!s}),ue=Re(()=>s?wm(s,{days:B}):Promise.resolve({ok:!0,usage:null}),6e4,{enabled:!!s}),me=Re(()=>s?km(s,{range:U}):Promise.resolve({ok:!0,trends:null}),6e4,{enabled:!!s}),V=Re(()=>Sm({days:XP}),6e4,{enabled:!s}),J=Re(()=>Cm({sinceMs:Date.now()-QP*24*60*60*1e3,limitPerJob:1200}),3e4,{enabled:!s});L(()=>{let H=Fe();H[sf]=r,Ct(H)},[r]),L(()=>{he.data?.runs&&(p(Array.isArray(he.data.runs.entries)?he.data.runs.entries:[]),g(!!he.data.runs.hasMore),h(Number(he.data.runs.nextOffset||0)),x(Number(he.data.runs.total||0)))},[he.data]);let oe=F(()=>Array.isArray(ne.data?.jobs)?ne.data.jobs:[],[ne.data]),ce=F(()=>oe.find(H=>String(H?.id||"")===s)||null,[oe,s]);L(()=>{if(!s){S(""),_(""),R(ds);return}let H=String(ce?.payload?.message||"");S(H),_(H),R(of(ce))},[s,ce?.payload?.message]),L(()=>{s&&R(of(ce))},[s,ce?.sessionTarget,ce?.wakeMode,ce?.delivery?.mode]),L(()=>{p([]),g(!1),h(0),x(0),s&&he.refresh()},[s,c]),L(()=>{s&&ue.refresh()},[s,B]),L(()=>{s&&(se(null),me.refresh())},[U,s]);let be=F(()=>{let H=Array.isArray(u)?u:[],re=G;if(!re)return H;let ye=Number(re?.startMs||0),ve=Number(re?.endMs||0);return!Number.isFinite(ye)||!Number.isFinite(ve)||ve<=ye?H:H.filter(Ie=>{let gt=Number(Ie?.ts||0);return Number.isFinite(gt)&&gt>=ye&&gt<ve})},[u,G]),Ve=q(H=>{let re=o.current;if(!re)return;let ye=re.parentElement?.getBoundingClientRect();if(!ye)return;let ve=Z0(Math.round(H-ye.left));i(ve)},[]),et=q(H=>{H.preventDefault(),l(!0),Ve(H.clientX)},[Ve]);L(()=>{if(!a)return()=>{};let H=Ie=>Ve(Ie.clientX),re=()=>l(!1);window.addEventListener("pointermove",H),window.addEventListener("pointerup",re);let ye=document.body.style.userSelect,ve=document.body.style.cursor;return document.body.style.userSelect="none",document.body.style.cursor="col-resize",()=>{window.removeEventListener("pointermove",H),window.removeEventListener("pointerup",re),document.body.style.userSelect=ye,document.body.style.cursor=ve}},[a,Ve]);let kt=q(()=>{e("/cron")},[e]),Ot=q(H=>{e(`/cron/${encodeURIComponent(String(H||""))}`)},[e]),Q=q(()=>{ne.refresh(),xe.refresh(),he.refresh(),ue.refresh(),me.refresh(),V.refresh(),J.refresh()},[J.refresh,V.refresh,ne.refresh,he.refresh,xe.refresh,me.refresh,ue.refresh]),pe=q(async()=>{if(!(!s||O)){D(!0);try{await _m(s),N("Cron run triggered","success"),Q()}catch(H){N(H.message||"Could not run cron job","error")}finally{D(!1)}}},[Q,O,s]),te=q(async H=>{if(!(!s||z)){E(!0);try{await Mm(s,H),N(H?"Cron job enabled":"Cron job disabled","success"),Q()}catch(re){N(re.message||"Could not update cron job","error")}finally{E(!1)}}},[Q,s,z]),Ee=q(async()=>{if(!(!s||!f||v)){w(!0);try{let H=await cd(s,{limit:K0,offset:m,status:c,sortDir:"desc"}),re=Array.isArray(H?.runs?.entries)?H.runs.entries:[];p(ye=>[...ye,...re]),g(!!H?.runs?.hasMore),h(Number(H?.runs?.nextOffset||0)),x(Number(H?.runs?.total||0))}catch(H){N(H.message||"Could not load more runs","error")}finally{w(!1)}}},[v,f,m,c,s]),ke=q(async()=>{if(!s||!ce||k)return;let H=of(ce),re={sessionTarget:String(M?.sessionTarget||ds.sessionTarget),wakeMode:String(M?.wakeMode||ds.wakeMode),deliveryMode:String(M?.deliveryMode||ds.deliveryMode),deliveryChannel:String(M?.deliveryChannel||""),deliveryTo:String(M?.deliveryTo||"")},ye=re.sessionTarget===H.sessionTarget&&re.wakeMode===H.wakeMode&&re.deliveryMode===H.deliveryMode&&re.deliveryChannel===H.deliveryChannel&&re.deliveryTo===H.deliveryTo,ve=$===C;if(!(ye&&ve)){A(!0);try{ye||await Tm(s,re),ve||(await Am(s,$),_($)),N("Changes saved","success"),Q()}catch(Ie){N(Ie.message||"Could not save changes","error")}finally{A(!1)}}},[$,Q,M,C,k,ce,s]);return L(()=>{s&&String(M?.deliveryMode||"none")==="announce"&&(!ie?.channel&&!ie?.to||R((H=ds)=>{let re=String(ie?.channel||H.deliveryChannel||""),ye=String(ie?.to||H.deliveryTo||"");return re===String(H.deliveryChannel||"")&&ye===String(H.deliveryTo||"")?H:{...H,deliveryChannel:re,deliveryTo:ye}}))},[M?.deliveryMode,ie?.channel,ie?.to,s]),{refs:{listPanelRef:o},state:{jobs:oe,jobsError:ne.error,status:xe.data?.status||null,statusError:xe.error,selectedRouteKey:n,selectedJobId:s,selectedJob:ce,listPanelWidthPx:r,isResizingListPanel:a,runEntries:u,filteredRunEntries:be,runHasMore:f,runNextOffset:m,runTotal:b,runStatusFilter:c,runsError:he.error,loadingMoreRuns:v,usage:ue.data?.usage||null,jobTrends:me.data?.trends||null,usageError:ue.error,trendsError:me.error,usageDays:B,jobTrendRange:U===J0?J0:U===G0?G0:q0,selectedJobTrendBucketFilter:G,bulkUsageByJobId:V.data?.usage?.byJobId||{},bulkUsageError:V.error,bulkRunsByJobId:J.data?.runs?.byJobId||{},bulkRunsError:J.error,promptValue:$,savedPromptValue:C,savingChanges:k,runningJob:O,togglingJobEnabled:z,routingDraft:M,deliverySessions:K,loadingDeliverySessions:j,deliverySessionsError:X,destinationSessionKey:de},actions:{setRunStatusFilter:d,setUsageDays:I,setJobTrendRange:W,setSelectedJobTrendBucketFilter:se,setPromptValue:S,saveChanges:ke,refreshAll:Q,loadMoreRuns:Ee,runSelectedJobNow:pe,setSelectedJobEnabled:te,selectAllJobs:kt,selectJob:Ot,onListResizerPointerDown:et,setRoutingDraft:R,setDestinationSessionKey:le}}};var us=P.bind(T),X0=({jobId:t="",onSetLocation:e=()=>{}})=>{let{state:n,actions:s}=Y0({jobId:t,onSetLocation:e}),[o,r]=y(!1),i=ee(null),a=n.selectedRouteKey===ws,l=n.jobs.length===0,c=n.selectedJob,d=F(()=>{if(a)return"All jobs";let g=n.jobs.find(m=>String(m?.id||"")===String(n.selectedRouteKey||""));return String(g?.name||g?.id||"All jobs")},[a,n.jobs,n.selectedRouteKey]),u=F(()=>{if(a||!c)return!1;let g=String(n.routingDraft?.sessionTarget||c?.sessionTarget||"main"),m=String(n.routingDraft?.wakeMode||c?.wakeMode||"now"),h=String(n.routingDraft?.deliveryMode||c?.delivery?.mode||"none"),b=String(c?.sessionTarget||"main"),x=String(c?.wakeMode||"now"),v=String(c?.delivery?.mode||"none"),w=g!==b||m!==x||h!==v,$=n.promptValue!==n.savedPromptValue;return w||$},[a,c,n.promptValue,n.routingDraft?.deliveryMode,n.routingDraft?.sessionTarget,n.routingDraft?.wakeMode,n.savedPromptValue]);L(()=>{if(!o)return()=>{};let g=h=>{i.current?.contains(h.target)||r(!1)},m=h=>{h.key==="Escape"&&r(!1)};return window.addEventListener("pointerdown",g),window.addEventListener("keydown",m),()=>{window.removeEventListener("pointerdown",g),window.removeEventListener("keydown",m)}},[o]);let p=()=>{s.selectAllJobs(),r(!1)},f=g=>{s.selectJob(g),r(!1)};return us`
    <div class="cron-tab-shell">
      <div class="cron-tab-header">
        <div class="cron-tab-header-content">
          <${Ne}
            leading=${us`
              <div class="cron-tab-selector-shell" ref=${i}>
                <button
                  type="button"
                  class=${`cron-tab-selector-toggle ${o?"is-open":""}`}
                  onClick=${()=>r(g=>!g)}
                  aria-expanded=${o}
                  aria-haspopup="listbox"
                >
                  <span class="cron-tab-selector-title">${d}</span>
                  <span class="cron-tab-selector-caret">▾</span>
                </button>
                ${o?us`
                      <div class="cron-tab-selector-dropdown">
                        <${ev}
                          jobs=${n.jobs}
                          selectedRouteKey=${n.selectedRouteKey}
                          onSelectAllJobs=${p}
                          onSelectJob=${f}
                        />
                      </div>
                    `:null}
              </div>
            `}
            actions=${us`
              ${a||l?us`
                    <${Z}
                      onClick=${s.refreshAll}
                      tone="secondary"
                      size="sm"
                      idleLabel="Refresh"
                    />
                  `:us`
                    <${Z}
                      onClick=${s.saveChanges}
                      loading=${n.savingChanges}
                      disabled=${!u}
                      tone="primary"
                      size="sm"
                      idleLabel="Save changes"
                      loadingLabel="Saving..."
                    />
                  `}
            `}
          />
        </div>
      </div>
      <div class="cron-tab-main">
        <div class="cron-tab-main-content">
          <main class="cron-detail-panel">
            ${l?us`
                  <div
                    class="bg-surface border border-border rounded-xl px-6 py-10 min-h-[26rem] flex flex-col items-center justify-center text-center"
                  >
                    <div class="max-w-md w-full flex flex-col items-center gap-4">
                      <${Ta} className="h-12 w-12 text-cyan-400" />
                      <div class="space-y-2">
                        <h2 class="font-semibold text-lg text-bright">
                          No cron jobs yet
                        </h2>
                        <p class="text-xs text-fg-muted leading-5">
                          Cron jobs are managed via the OpenClaw CLI. Once jobs are
                          configured, schedules and run history will appear here.
                        </p>
                      </div>
                    </div>
                  </div>
                `:a?us`
                    <${H0}
                      jobs=${n.jobs}
                      status=${n.status}
                      bulkUsageByJobId=${n.bulkUsageByJobId}
                      bulkRunsByJobId=${n.bulkRunsByJobId}
                      onSelectJob=${f}
                    />
                  `:us`
                    <${w0}
                      job=${n.selectedJob}
                      runEntries=${n.runEntries}
                      filteredRunEntries=${n.filteredRunEntries}
                      runTotal=${n.runTotal}
                      runHasMore=${n.runHasMore}
                      loadingMoreRuns=${n.loadingMoreRuns}
                      runStatusFilter=${n.runStatusFilter}
                      onSetRunStatusFilter=${s.setRunStatusFilter}
                      onLoadMoreRuns=${s.loadMoreRuns}
                      onRunNow=${s.runSelectedJobNow}
                      runningJob=${n.runningJob}
                      onToggleEnabled=${s.setSelectedJobEnabled}
                      togglingJobEnabled=${n.togglingJobEnabled}
                      usage=${n.usage}
                      jobTrends=${n.jobTrends}
                      jobTrendRange=${n.jobTrendRange}
                      selectedJobTrendBucketFilter=${n.selectedJobTrendBucketFilter}
                      usageDays=${n.usageDays}
                      onSetUsageDays=${s.setUsageDays}
                      onSetJobTrendRange=${s.setJobTrendRange}
                      onSetSelectedJobTrendBucketFilter=${s.setSelectedJobTrendBucketFilter}
                      promptValue=${n.promptValue}
                      savedPromptValue=${n.savedPromptValue}
                      onChangePrompt=${s.setPromptValue}
                      onSaveChanges=${s.saveChanges}
                      savingChanges=${n.savingChanges}
                      routingDraft=${n.routingDraft}
                      onChangeRoutingDraft=${s.setRoutingDraft}
                      deliverySessions=${n.deliverySessions}
                      loadingDeliverySessions=${n.loadingDeliverySessions}
                      deliverySessionsError=${n.deliverySessionsError}
                      destinationSessionKey=${n.destinationSessionKey}
                      onChangeDestinationSessionKey=${s.setDestinationSessionKey}
                    />
                  `}
          </main>
        </div>
      </div>
    </div>
  `};var t3=P.bind(T),rf=({jobId:t="",onSetLocation:e=()=>{}})=>t3`
  <${X0} jobId=${t} onSetLocation=${e} />
`;var tw=(t="")=>{let e=String(t||"").trim().toUpperCase();return e==="P0"?"danger":e==="P1"?"warning":"neutral"};var nw=(t="")=>{let e=String(t||"").trim().toLowerCase().replace(/[_-]+/g," ");return e==="token efficiency"?"info":e==="redundancy"?"accent":e==="mixed concerns"?"cyan":e==="workspace state"?"secondary":"info"},sw=(t="")=>{let e=String(t||"").trim().replace(/[_-]+/g," ");return e?e.replace(/\b\w/g,n=>n.toUpperCase()):"Workspace"},ow=(t=[])=>t.reduce((e,n)=>{let s=String(n?.priority||"").trim().toUpperCase();return(s==="P0"||s==="P1"||s==="P2")&&(e[s]+=1),e},{P0:0,P1:0,P2:0});var fc=(t=null,e=0)=>!t||t.runInProgress||t.needsInitialRun||!t.stale||!t.changeSummary?.hasMeaningfulChanges?!1:Number(e||0)<=Date.now(),rw=(t=null)=>{if(!t)return"";let e=Number(t.changeSummary?.changedFilesCount||0);return e>0?`Drift Doctor has not been run in the last week and ${e} file${e===1?"":"s"} changed since the last review.`:"Doctor has not been run in the last week."},Q0=(t=0)=>`${Number(t||0).toLocaleString()} chars`,ew=(t="")=>String(t||"").startsWith("hooks/bootstrap/"),hc=(t=null)=>{let e=t?.bootstrapContext,n=(e?.activeTruncatedFiles||[]).filter(o=>!ew(o?.path)),s=(e?.activeNearLimitFiles||[]).filter(o=>!ew(o?.path));return[...n.map(o=>({path:o.path,size:Q0(o.rawChars),statusText:`-${Number(Math.max(0,Number(o.rawChars||0)-Number(o.injectedChars||0))).toLocaleString()} cut`,statusTone:"danger"})),...s.map(o=>({path:o.path,size:Q0(o.rawChars),statusText:"Near limit",statusTone:"warning"}))]},iw=(t=null)=>hc(t).length>0,aw=(t=null)=>{let e=hc(t);if(!e.length)return"";let n=e.some(o=>o.statusTone==="danger"),s=e.some(o=>o.statusTone==="warning");return n&&s?"Some of your main files are being truncated or nearing the limit:":s?e.length===1?"One of your main files is nearing the limit:":"Some of your main files are nearing the limit:":e.length===1?"One of your main files is being truncated:":"Some of your main files are being truncated:"},lw=(t=null)=>{let e=Number(t?.changedFilesCount||0);return e===0?"No changes since last run":`${e} change${e===1?"":"s"} since last run`},cw=(t=null)=>!t||typeof t!="object"?"":t.status==="running"?"Running":t.status==="failed"?"Failed":(t.cardCount||0)===0?"No findings":`${t.cardCount||0} finding${t.cardCount===1?"":"s"}`,dw=(t=null)=>{if(!t||typeof t!="object")return[];if(t.status==="running")return[{tone:"cyan",count:0,label:"Running"}];if(t.status==="failed")return[{tone:"neutral",count:0,label:"Failed"}];if((t.cardCount||0)===0)return[{tone:"success",count:0,label:"No findings"}];let e=[];return Number(t?.priorityCounts?.P0||0)>0&&e.push({tone:"danger",count:0,label:"P0"}),Number(t?.priorityCounts?.P1||0)>0&&e.push({tone:"warning",count:0,label:"P1"}),e.length>0?e.slice(0,2):[{tone:"neutral",count:0,label:"P2"}]},uw=()=>[{value:"open",label:"Open"},{value:"dismissed",label:"Dismissed"},{value:"fixed",label:"Fixed"}];var n3=P.bind(T),pw=({cards:t=[]})=>{let e=ow(t);return n3`
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
      <${cs} title="Open Findings" value=${t.length} />
      <${cs} title="P0" value=${e.P0} toneClassName="text-status-error-muted" />
      <${cs} title="P1" value=${e.P1} toneClassName="text-status-warning-muted" />
      <${cs} title="P2" value=${e.P2} toneClassName="text-body" />
    </div>
  `};var lt=P.bind(T),s3=t=>t?typeof t=="string"?{path:t}:typeof t=="object"&&t.path?t:null:null,af=(t,e,n)=>e&&n&&n>e?`${t}:${e}-${n}`:e?`${t}:${e}`:t,lf=(t,e)=>{let n={};return t&&(n.line=t),e&&e>t&&(n.lineEnd=e),n},o3=(t,e,{startLine:n,endLine:s}={})=>{let o=af(t,n,s);return lt`
    <button
      type="button"
      class="text-left font-mono ac-tip-link hover:underline cursor-pointer"
      onClick=${r=>{r.preventDefault(),e(String(t||""),lf(n,s))}}
    >
      ${o}
    </button>
  `},fw=7,r3=({item:t,onOpenFile:e,isOutdated:n})=>{let s=t.snippet,o=String(s.text||"").split(`
`),r=o.length>fw,[i,a]=y(!r),l=i?o:o.slice(0,fw),c=String(s.endLine||s.startLine||1).length;return lt`
    <div class="mt-1.5 rounded-lg border border-border overflow-hidden">
      <div
        class="flex items-center justify-between px-3 py-1.5 bg-field border-b border-border"
      >
        <button
          type="button"
          class="text-[11px] font-mono ac-tip-link hover:underline cursor-pointer"
          onClick=${d=>{d.preventDefault(),e(String(t.path||""),lf(t.startLine,t.endLine))}}
        >
          ${af(t.path,t.startLine,t.endLine)}
        </button>
        ${n?lt`<span class="text-[10px] text-status-warning-muted/80"
              >file changed since scan</span
            >`:lt`<span class="text-[10px] text-fg-dim">snapshot</span>`}
      </div>
      <div class="relative">
        <div
          class="px-3 py-2 text-[11px] leading-[18px] font-mono text-body bg-field"
          style="white-space:pre-wrap;word-break:break-word"
        >
          ${l.map((d,u)=>lt`
              <div class="flex">
                <span
                  class="text-fg-dim select-none shrink-0"
                  style="width:${c+1}ch;text-align:right;margin-right:1ch"
                  >${s.startLine+u}</span
                ><span>${d||" "}</span>
              </div>
            `)}
          ${i&&s.truncated?lt`<div class="text-fg-dim italic pl-1">... truncated</div>`:""}
        </div>
        ${r&&!i?lt`
              <button
                type="button"
                class="absolute inset-x-0 bottom-0 flex items-end justify-center pb-2 pt-10 cursor-pointer snippet-collapse-fade"
                onClick=${()=>a(!0)}
              >
                <span
                  class="text-[10px] text-fg-muted hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span
                    class="inline-block text-xs transition-transform"
                    aria-hidden="true"
                    >▾</span
                  >
                  ${o.length} lines
                </span>
              </button>
            `:null}
        ${r&&i?lt`
              <button
                type="button"
                class="w-full flex items-center justify-center py-1 cursor-pointer bg-field border-t border-border"
                onClick=${()=>a(!1)}
              >
                <span class="text-[10px] text-fg-muted flex items-center gap-1">
                  <span
                    class="inline-block transition-transform"
                    aria-hidden="true"
                    >▴</span
                  >
                  collapse
                </span>
              </button>
            `:null}
      </div>
    </div>
  `},i3=(t={},e,n)=>{if(t?.path&&t?.snippet){let s=n.has(t.path);return lt`<${r3}
      item=${t}
      onOpenFile=${e}
      isOutdated=${s}
    />`}return t?.path?o3(t.path,e,{startLine:t.startLine,endLine:t.endLine}):t?.text?t.text:JSON.stringify(t)},hw=({cards:t=[],busyCardId:e=0,onAskAgentFix:n=()=>{},onUpdateStatus:s=()=>{},onOpenFile:o=()=>{},changedPaths:r=[],showRunMeta:i=!1,hideEmptyState:a=!1})=>{let l=new Set(r);return lt`
    <div class="space-y-4">
      ${t.length?lt`
            <div class="space-y-3">
              ${t.map(c=>lt`
                  <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
                    <div class="space-y-2">
                      <div class="flex flex-wrap items-start justify-between gap-3">
                        <div class="space-y-2 min-w-0">
                          <div class="flex flex-wrap items-center gap-2">
                            <${ae} tone=${tw(c.priority)}>
                              ${c.priority}
                            </${ae}>
                            <h3 class="text-sm font-semibold text-bright">
                              ${c.title}
                            </h3>
                          </div>
                          <div class="flex flex-wrap items-center gap-2">
                            <${ae} tone=${nw(c.category)}>
                              ${sw(c.category)}
                            </${ae}>
                            ${i?lt`
                                    <span class="text-xs text-fg-dim"
                                      >Run #${c.runId}</span
                                    >
                                  `:null}
                          </div>
                        </div>
                      </div>
                      ${c.summary?lt`<p
                              class="text-xs text-body leading-5 pt-1"
                            >
                              ${c.summary}
                            </p>`:null}
                    </div>
                    <details class="group rounded-lg border border-border bg-field">
                      <summary class="list-none cursor-pointer px-3 py-2.5 text-xs text-fg-muted group-open:border-b group-open:border-border">
                        <span class="inline-flex items-center gap-2">
                          <span
                            class="inline-block text-fg-muted transition-transform duration-200 group-open:rotate-90"
                            aria-hidden="true"
                            >▸</span
                          >
                          <span>Show recommendation and details</span>
                        </span>
                      </summary>
                      <div class="p-3 space-y-3">
                        <div>
                          <div class="ac-small-heading">
                            Recommendation
                          </div>
                          <p class="text-xs text-body mt-1 leading-5">
                            ${c.recommendation}
                          </p>
                        </div>
                        ${Array.isArray(c.targetPaths)&&c.targetPaths.length?lt`
                                <div>
                                  <div class="ac-small-heading">
                                    Target paths
                                  </div>
                                  <div class="mt-1 flex flex-wrap gap-1.5">
                                    ${c.targetPaths.map(d=>{let u=s3(d);if(!u)return null;let p=af(u.path,u.startLine,u.endLine);return lt`
                                        <button
                                          type="button"
                                          class="text-[11px] px-2 py-1 rounded-md bg-field border border-border font-mono text-body hover:text-white hover:border-fg-muted cursor-pointer transition-colors"
                                          onClick=${f=>{f.preventDefault(),o(String(u.path||""),lf(u.startLine,u.endLine))}}
                                        >
                                          ${p}
                                        </button>
                                      `})}
                                  </div>
                                </div>
                              `:null}
                        ${Array.isArray(c.evidence)&&c.evidence.length?lt`
                                <div>
                                  <div class="ac-small-heading">Evidence</div>
                                  <div class="mt-1 space-y-2">
                                    ${c.evidence.map(d=>lt`
                                        <div class="text-xs text-fg-muted">
                                          ${i3(d,o,l)}
                                        </div>
                                      `)}
                                  </div>
                                </div>
                              `:null}
                      </div>
                    </details>
                    <div class="flex flex-wrap gap-2">
                      <${Z}
                        onClick=${()=>n(c)}
                        loading=${e===c.id}
                        tone="primary"
                        idleLabel="Ask agent to fix"
                        loadingLabel="Sending..."
                      />
                      ${c.status!=="fixed"?lt`
                              <${Z}
                                onClick=${()=>s(c,"fixed")}
                                tone="secondary"
                                idleLabel="Mark fixed"
                              />
                            `:lt`
                              <${Z}
                                onClick=${()=>s(c,"open")}
                                tone="secondary"
                                idleLabel="Reopen"
                              />
                            `}
                      ${c.status!=="dismissed"?lt`
                              <${Z}
                                onClick=${()=>s(c,"dismissed")}
                                tone="ghost"
                                idleLabel="Dismiss"
                              />
                            `:lt`
                              <${Z}
                                onClick=${()=>s(c,"open")}
                                tone="ghost"
                                idleLabel="Restore"
                              />
                            `}
                    </div>
                  </div>
                `)}
            </div>
          `:a?null:lt`
              <div class="ac-surface-inset rounded-xl p-4 space-y-1.5">
                <p class="text-xs text-body leading-5">
                  No findings currently for this selection.
                </p>
              </div>
            `}
    </div>
  `};var jn=P.bind(T),vr=({label:t="Send to session",sessions:e=[],selectedSessionKey:n="",onChangeSessionKey:s=()=>{},disabled:o=!1,loading:r=!1,error:i="",allowNone:a=!1,noneValue:l="__none__",noneLabel:c="None",emptyOptionLabel:d="No sessions available",helperText:u="",emptyStateText:p="",loadingLabel:f="Loading sessions...",containerClassName:g="space-y-2",labelClassName:m="text-xs text-fg-muted",selectClassName:h="w-full bg-field border border-border rounded-lg px-3 py-2 text-xs text-body focus:border-fg-muted",helperClassName:b="text-xs text-fg-muted",statusClassName:x="text-xs text-fg-muted",errorClassName:v="text-xs text-status-error-muted"})=>{let w=n||(a?l:""),$=o||r;return jn`
    <div class=${g}>
      ${t?jn`<label class=${m}>${t}</label>`:null}
      <select
        value=${w}
        onInput=${S=>{let C=String(S.currentTarget?.value||"");s(a&&C===l?"":C)}}
        disabled=${$}
        class=${h}
      >
        ${r?jn`<option value=${w||""}>${f}</option>`:jn`
              ${a?jn`<option value=${l}>${c}</option>`:null}
              ${!a&&e.length===0?jn`<option value="">${d}</option>`:null}
              ${e.map(S=>jn`
                  <option value=${Je(S)}>
                    ${String(S?.label||Je(S)||"Session")}
                  </option>
                `)}
            `}
      </select>
      ${u?jn`<div class=${b}>${u}</div>`:null}
      ${i?jn`<div class=${v}>${i}</div>`:null}
      ${!r&&!i&&p&&e.length===0?jn`<div class=${x}>${p}</div>`:null}
    </div>
  `};var mw=P.bind(T),mc=({visible:t=!1,title:e="Send to agent",messageLabel:n="Message",messageRows:s=8,initialMessage:o="",resetKey:r="",submitLabel:i="Send message",loadingLabel:a="Sending...",cancelLabel:l="Cancel",onClose:c=()=>{},onSubmit:d=async()=>!0,sessionFilter:u=void 0})=>{let{sessions:p,selectedSessionKey:f,setSelectedSessionKey:g,selectedSession:m,loading:h,error:b}=yr({enabled:t,filter:u}),[x,v]=y(""),[w,$]=y(!1);L(()=>{t&&v(String(o||""))},[t,o,r]);let S=async()=>{if(!m||w)return;let C=String(x||"").trim();if(C){$(!0);try{await d({selectedSession:m,selectedSessionKey:f,message:C})!==!1&&c()}finally{$(!1)}}};return mw`
    <${De}
      visible=${t}
      onClose=${()=>{w||c()}}
      panelClassName="bg-modal border border-border rounded-xl p-5 max-w-lg w-full space-y-4"
    >
      <${Ne}
        title=${e}
        actions=${mw`
          <button
            type="button"
            onclick=${()=>{w||c()}}
            class="h-8 w-8 inline-flex items-center justify-center rounded-lg ac-btn-secondary"
            aria-label="Close modal"
          >
            <${nt} className="w-3.5 h-3.5 text-body" />
          </button>
        `}
      />
      <${vr}
        label="Send to session"
        sessions=${p}
        selectedSessionKey=${f}
        onChangeSessionKey=${g}
        disabled=${h||w}
        loading=${h}
        error=${b}
        emptyOptionLabel="No sessions available"
      />
      <div class="space-y-2">
        <label class="text-xs text-fg-muted">${n}</label>
        <textarea
          value=${x}
          onInput=${C=>v(String(C.currentTarget?.value||""))}
          disabled=${w}
          rows=${s}
          class="w-full bg-field border border-border rounded-lg px-3 py-2 text-xs text-body focus:border-fg-muted font-mono leading-5"
        ></textarea>
      </div>
      <div class="flex items-center justify-end gap-2">
        <${Z}
          onClick=${c}
          disabled=${w}
          tone="secondary"
          size="md"
          idleLabel=${l}
        />
        <${Z}
          onClick=${S}
          disabled=${!m||h||!!b||!String(x||"").trim()}
          loading=${w}
          tone="primary"
          size="md"
          idleLabel=${i}
          loadingLabel=${a}
        />
      </div>
    </${De}>
  `};var a3=P.bind(T),gw=({visible:t=!1,card:e=null,onClose:n=()=>{},onComplete:s=()=>{}})=>{let o=async({selectedSession:r,message:i})=>{if(!e?.id)return!1;try{await nm({cardId:e.id,sessionId:r?.sessionId||"",replyChannel:r?.replyChannel||"",replyTo:r?.replyTo||"",prompt:i});try{await pa({cardId:e.id,status:"fixed"}),N("Doctor fix request sent and finding marked fixed","success")}catch(a){N(a.message||"Doctor fix request sent, but could not mark the finding fixed","warning")}return await s(),!0}catch(a){return N(a.message||"Could not send Doctor fix request","error"),!1}};return a3`
    <${mc}
      visible=${t}
      title="Ask agent to fix"
      messageLabel="Instructions"
      initialMessage=${String(e?.fixPrompt||"")}
      resetKey=${String(e?.id||"")}
      submitLabel="Send fix request"
      loadingLabel="Sending..."
      onClose=${n}
      onSubmit=${o}
    />
  `};var wt=P.bind(T),cf=15e3,bw=2e3,l3=()=>wt`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    class="h-12 w-12 text-cyan-400"
  >
    <path
      d="M8 20V14H16V20H19V4H5V20H8ZM10 20H14V16H10V20ZM21 20H23V22H1V20H3V3C3 2.44772 3.44772 2 4 2H20C20.5523 2 21 2.44772 21 3V20ZM11 8V6H13V8H15V10H13V12H11V10H9V8H11Z"
    ></path>
  </svg>
`,xw=({isActive:t=!1,onOpenFile:e=()=>{}})=>{let n=Re(ua,cf,{enabled:t}),s=n.data?.status||null,o=s?.runInProgress?bw:cf,r=Re(()=>em(10),o,{enabled:t}),[i,a]=y("all"),[l,c]=y("open"),[d,u]=y(0),[p,f]=y(null),[g,m]=y(""),h=r.data?.runs||[],b=String(s?.activeRunId||""),x=String(i||""),w=x!==""&&x!=="all"&&!h.some(J=>String(J.id||"")===x)&&(g===x||s?.runInProgress&&b===x)?{id:Number(x||0),status:"running",summary:"",priorityCounts:{P0:0,P1:0,P2:0},statusCounts:{open:0,dismissed:0,fixed:0}}:null,$=w?[w,...h]:h,S=i!=="all"&&!!b&&String(i||"")===b,C=i==="all"?null:$.find(J=>String(J.id||"")===String(i||""))||null,_=Re(()=>tm({runId:i||"all"}),s?.runInProgress||C?.status==="running"?bw:cf,{enabled:t}),k=_.data?.cards||[];L(()=>{t&&(n.refresh(),r.refresh())},[t]),L(()=>{if(!h.length){if(g&&x===g||S&&s?.runInProgress)return;i!=="all"&&a("all");return}i==="all"||h.some(oe=>String(oe.id||"")===String(i||""))||S&&s?.runInProgress||a("all")},[h,x,i,S,g,s?.runInProgress]),L(()=>{if(!g)return;if(i!==g){a(g);return}let J=h.some(ce=>String(ce.id||"")===String(g||"")),oe=!!b&&b===g&&!!s?.runInProgress;!J&&!oe||m("")},[b,s?.runInProgress,g,h,i]),L(()=>{_.refresh()},[i]);let A=C?.status==="running"||S&&s?.runInProgress,O=F(()=>A?"":C?.summary||"",[C,A]),D=F(()=>uw(),[]),z=F(()=>lw(s?.changeSummary||null),[s]),E=F(()=>s?.runInProgress||s?.needsInitialRun?!0:Number(s?.changeSummary?.changedFilesCount||0)>0,[s]),M=E?"":"No workspace changes since the last completed Drift Doctor run.",R=F(()=>fc(s,0),[s]),B=F(()=>iw(s),[s]),I=F(()=>aw(s),[s]),U=F(()=>hc(s),[s]),W=!!s?.lastRunAt,G=h.length>0,se=r.data!==null||r.error!==null,K=_.data!==null||_.error!==null,j=!se||G&&!K,X=F(()=>l==="all"?k:k.filter(J=>String(J?.status||"open").trim().toLowerCase()===l),[k,l]),de=F(()=>k.filter(J=>String(J?.status||"open").trim().toLowerCase()==="open"),[k]),le=F(()=>$.slice(0,2),[$]),ie=F(()=>$.slice(2),[$]),ne=F(()=>i==="all"?"":ie.some(J=>String(J.id||"")===String(i||""))?String(i||""):"",[ie,i]),xe=(J=!1)=>["inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",J?"border-cyan-500/40 bg-cyan-500/10 text-status-info shadow-[0_0_0_1px_rgba(34,211,238,0.08)]":"border-border bg-field text-body hover:border-fg-muted hover:text-bright"].join(" "),he=(J="neutral")=>J==="success"?"bg-green-400":J==="warning"?"bg-yellow-400":J==="danger"?"bg-red-400":J==="cyan"?"ac-status-dot ac-status-dot--info":"bg-gray-500",ue=!j&&(h.length>0||!!g||!!b||!!s?.runInProgress),me=async()=>{try{let J=await Qh();if(N(J?.reusedPreviousRun?"No workspace changes since the last scan; reused previous findings":"Doctor run started","success"),J?.runId){let oe=String(J.runId);m(oe),a(oe)}n.refresh(),r.refresh(),_.refresh(),setTimeout(n.refresh,1200),setTimeout(r.refresh,1200),setTimeout(_.refresh,1200)}catch(J){N(J.message||"Could not start Doctor run","error")}},V=async(J,oe)=>{if(!(!J?.id||d))try{u(J.id),await pa({cardId:J.id,status:oe}),N("Doctor card updated","success"),await _.refresh(),await r.refresh(),await n.refresh()}catch(ce){N(ce.message||"Could not update Doctor card","error")}finally{u(0)}};return wt`
    <div class="space-y-4">
      ${ue?wt`
            <${Ne}
              title="Drift Doctor"
              actions=${wt`
                <${Z}
                  onClick=${me}
                  disabled=${!E}
                  loading=${!!s?.runInProgress}
                  idleLabel="Run Drift Doctor"
                  loadingLabel="Running..."
                  title=${M}
                />
              `}
            />
          `:null}
      ${j?wt`
            <div class="bg-surface border border-border rounded-xl p-5">
              <div class="flex items-center gap-3 text-sm text-fg-muted">
                <${Ce} className="h-4 w-4" />
                <span>Loading Drift Doctor...</span>
              </div>
            </div>
          `:null}
      ${!j&&G?wt`
            <div class="space-y-3">
              <${pw} cards=${de} />
              <div class="space-y-3">
                ${W?wt`
                      <div
                        class="bg-surface border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                      >
                        <span class="text-xs text-fg-muted">
                          Last run ·${" "}
                          <span class="text-body">
                            ${Wo(s?.lastRunAt,{fallback:"Never"})}
                          </span>
                        </span>
                        <span class="text-xs text-fg-muted">
                          ${z}
                        </span>
                      </div>
                      ${B?wt`
                            <div
                              class="bg-surface border border-border rounded-xl p-4 space-y-3"
                            >
                              <div class="text-xs text-fg-muted">
                                ⚠️ ${I}
                              </div>
                              <div class="space-y-2">
                                ${U.map(J=>wt`
                                    <div
                                      class="flex items-center justify-between gap-3 text-xs"
                                    >
                                      <button
                                        type="button"
                                        class="font-mono text-body ac-tip-link hover:underline text-left cursor-pointer"
                                        onClick=${()=>e(String(J.path||""))}
                                      >
                                        ${J.path}
                                      </button>
                                      <span
                                        class="flex items-center gap-3 whitespace-nowrap"
                                      >
                                        <span class="text-fg-muted">
                                          ${J.size}
                                        </span>
                                        <span
                                          class=${J.statusTone==="warning"?"text-status-warning":"text-status-error"}
                                        >
                                          ${J.statusText}
                                        </span>
                                      </span>
                                    </div>
                                  `)}
                              </div>
                              <div class="border-t border-border"></div>
                              <p class="text-xs text-fg-muted leading-5">
                                Truncated files become partially hidden from
                                your agent and could cause drift.
                              </p>
                            </div>
                          `:null}
                    `:null}
                ${R?wt`
                      <div
                        class="text-xs text-status-warning bg-yellow-500/10 border border-yellow-500/35 rounded-lg px-3 py-2"
                      >
                        Doctor should be run again because the latest completed
                        run is older than one week and the workspace has
                        changed.
                      </div>
                    `:null}
              </div>
            </div>
          `:null}
      ${ue?wt`
            <div class="space-y-4 pt-2">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <h2 class="font-semibold text-base">Findings</h2>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class=${xe(i==="all")}
                  onClick=${()=>a("all")}
                >
                  <span class="font-medium">All runs</span>
                </button>
                ${le.map(J=>{let oe=String(i||"")===String(J.id||""),ce=dw(J);return wt`
                    <button
                      key=${J.id}
                      type="button"
                      class=${xe(oe)}
                      onClick=${()=>a(String(J.id||""))}
                    >
                      <span class="font-medium">Run #${J.id}</span>
                      <span class="inline-flex items-center gap-1">
                        ${ce.map(be=>wt`
                            <span
                              class="inline-flex items-center"
                              title=${be.label}
                            >
                              <span
                                class=${he(be.tone).startsWith("ac-status-dot")?he(be.tone):`h-2 w-2 rounded-full ${he(be.tone)}`}
                              ></span>
                            </span>
                          `)}
                      </span>
                    </button>
                  `})}
                ${ie.length?wt`
                      <label
                        class="flex items-center gap-2 text-xs text-fg-muted"
                      >
                        <select
                          value=${ne}
                          onChange=${J=>{let oe=String(J.currentTarget?.value||"");oe&&a(oe)}}
                          class="bg-field border border-border rounded-full px-3 py-1.5 text-xs text-body focus:border-fg-muted"
                        >
                          <option value="">More runs</option>
                          ${ie.map(J=>wt`
                              <option value=${String(J.id||"")}>
                                Run #${J.id} · ${cw(J)}
                              </option>
                            `)}
                        </select>
                      </label>
                    `:null}
                <label class="flex items-center gap-2 text-xs text-fg-muted">
                  <select
                    value=${l}
                    onChange=${J=>c(String(J.currentTarget?.value||"open"))}
                    class="bg-field border border-border rounded-full px-3 py-1.5 text-xs text-body focus:border-fg-muted"
                  >
                    ${D.map(J=>wt`
                        <option value=${J.value}>${J.label}</option>
                      `)}
                  </select>
                </label>
              </div>
              ${O?wt`
                    <div class="ac-surface-inset rounded-xl p-4 space-y-1.5">
                      <div
                        class="text-[11px] uppercase tracking-wide text-fg-muted"
                      >
                        ${C?.id?`Run #${C.id} summary`:"Run summary"}
                      </div>
                      <p class="text-xs text-body leading-5">
                        ${O}
                      </p>
                    </div>
                  `:null}
              ${A?wt`
                    <div class="ac-surface-inset rounded-xl p-4">
                      <div class="flex items-center gap-2 text-xs leading-5 text-fg-muted">
                        <${Ce} className="h-3.5 w-3.5" />
                        <span>
                          Run in progress. Findings will appear when analysis
                          completes.
                        </span>
                      </div>
                    </div>
                  `:null}
              <div>
                <${hw}
                  cards=${X}
                  busyCardId=${d}
                  onAskAgentFix=${f}
                  onUpdateStatus=${V}
                  onOpenFile=${e}
                  changedPaths=${s?.changeSummary?.changedPaths||[]}
                  showRunMeta=${i==="all"}
                  hideEmptyState=${A}
                />
              </div>
            </div>
          `:null}
      ${!j&&!ue?wt`
            <div
              class="bg-surface border border-border rounded-xl px-6 py-10 min-h-[26rem] flex flex-col items-center justify-center text-center"
            >
              <div class="max-w-md w-full flex flex-col items-center gap-4">
                <${l3} />
                <div class="space-y-2">
                  <h2 class="font-semibold text-lg text-bright">
                    Workspace health review
                  </h2>
                  <p class="text-xs text-fg-muted leading-5">
                    Drift Doctor scans the workspace for guidance drift,
                    misplaced instructions, redundant docs, and cleanup
                    opportunities.
                  </p>
                </div>
                <div class="flex flex-col items-center gap-2 mt-8">
                  <${Z}
                    onClick=${me}
                    disabled=${!E}
                    loading=${!!s?.runInProgress}
                    size="lg"
                    idleLabel="Run Drift Doctor"
                    loadingLabel="Running..."
                    title=${M}
                  />
                  <p class="text-xs text-fg-muted leading-5 mt-10">
                    Runs on your main agent and consumes tokens. No
                    changes will be made without your approval.
                  </p>
                </div>
              </div>
            </div>
          `:null}
      <${gw}
        visible=${!!p}
        card=${p}
        onClose=${()=>f(null)}
        onComplete=${async()=>{await n.refresh(),await r.refresh(),await _.refresh()}}
      />
    </div>
  `};var c3=P.bind(T),df=({onNavigateToBrowseFile:t=()=>{}})=>c3`
  <div class="pt-4">
    <${xw}
      isActive=${!0}
      onOpenFile=${(e,n={})=>{let s=`workspace/${String(e||"").trim().replace(/^workspace\//,"")}`;t(s,{view:"edit",...n.line?{line:n.line}:{},...n.lineEnd?{lineEnd:n.lineEnd}:{}})}}
    />
  </div>
`;var d3=P.bind(T),zn=({header:t,children:e})=>d3`
  <div class="ac-pane-shell">
    <div class="ac-pane-header">
      <div class="ac-pane-header-content">
        ${t}
      </div>
    </div>
    <div class="ac-pane-body">
      <div class="ac-pane-body-content">
        ${e}
      </div>
    </div>
  </div>
`;var Ue=P.bind(T),yw={ai:"AI Provider Keys",github:"GitHub",channels:"Channels",tools:"Tools",custom:"Custom"},u3=["ai","github","channels","tools","custom"],p3=new Set(["OPENAI_API_KEY","GEMINI_API_KEY"]),ww={Embeddings:{Icon:_a,label:"Memory embeddings"},Image:{Icon:nb,label:"Image generation"},TTS:{Icon:sb,label:"Text to speech"},STT:{Icon:ob,label:"Speech to text"}},vw=t=>t.trim().toUpperCase().replace(/[^A-Z0-9_]/g,"_"),f3=/^(?:TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN|SLACK_BOT_TOKEN|SLACK_APP_TOKEN)(?:_[A-Z0-9_]+)?$/,h3=t=>{let e=String(t||"").trim();if(e.length<2)return e;let n=e.startsWith('"'),s=e.endsWith('"');if(n&&s)return e.slice(1,-1);let o=e.startsWith("'"),r=e.endsWith("'");return o&&r?e.slice(1,-1):e},gc=(t="")=>f3.test(String(t||"").trim().toUpperCase()),$w=t=>JSON.stringify((t||[]).map(e=>({key:String(e?.key||""),value:String(e?.value||"")})).sort((e,n)=>e.key.localeCompare(n.key))),m3=t=>{let e=Array.isArray(t)?[...t]:[],n=e.filter(o=>(o?.group||"custom")==="custom").sort((o,r)=>String(o?.key||"").localeCompare(String(r?.key||""))),s=0;return e.map(o=>{if((o?.group||"custom")!=="custom")return o;let r=n[s];return s+=1,r})},g3={ANTHROPIC_API_KEY:Ue`from${" "}
    <a
      href="https://console.anthropic.com"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >console.anthropic.com</a
    >`,ANTHROPIC_TOKEN:Ue`from
    <code class="text-xs bg-field px-1 rounded">claude setup-token</code>`,OPENAI_API_KEY:Ue`from${" "}
    <a
      href="https://platform.openai.com"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >platform.openai.com</a
    >`,GEMINI_API_KEY:Ue`from${" "}
    <a
      href="https://aistudio.google.com"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >aistudio.google.com</a
    >`,ELEVENLABS_API_KEY:Ue`from${" "}
    <a
      href="https://elevenlabs.io"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >elevenlabs.io</a
    >${" "} · ${" "}
    <code class="text-xs bg-field px-1 rounded">XI_API_KEY</code> also
    supported`,GITHUB_WORKSPACE_REPO:Ue`use
    <code class="text-xs bg-field px-1 rounded">owner/repo</code> or
    <code class="text-xs bg-field px-1 rounded"
      >https://github.com/owner/repo</code
    >`,TELEGRAM_BOT_TOKEN:Ue`from${" "}
    <a
      href="https://t.me/BotFather"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >@BotFather</a
    >
    ·
    <a
      href="https://docs.openclaw.ai/channels/telegram"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >full guide</a
    >`,DISCORD_BOT_TOKEN:Ue`from${" "}
    <a
      href="https://discord.com/developers/applications"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >developer portal</a
    >
    ·
    <a
      href="https://docs.openclaw.ai/channels/discord"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >full guide</a
    >`,MISTRAL_API_KEY:Ue`from${" "}
    <a
      href="https://console.mistral.ai"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >console.mistral.ai</a
    >`,VOYAGE_API_KEY:Ue`from${" "}
    <a
      href="https://dash.voyageai.com"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >dash.voyageai.com</a
    >`,GROQ_API_KEY:Ue`from${" "}
    <a
      href="https://console.groq.com"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >console.groq.com</a
    >`,DEEPGRAM_API_KEY:Ue`from${" "}
    <a
      href="https://console.deepgram.com"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >console.deepgram.com</a
    >`,BRAVE_API_KEY:Ue`from${" "}
    <a
      href="https://brave.com/search/api/"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >brave.com/search/api</a
    >${" "} — free tier available`},b3=t=>g3[t.key]||t.hint||"",x3=t=>(Array.isArray(t?.features)?t.features:[]).filter(e=>!!ww[e]),y3=t=>{let e=[],n=[];return(t||[]).forEach(s=>{let o=!!String(s?.value||"").trim();if(p3.has(s?.key)||o){e.push(s);return}n.push(s)}),{visible:e,hidden:n}},v3=({feature:t})=>{let e=ww[t];if(!e)return null;let{Icon:n,label:s}=e;return Ue`
    <${yt} text=${s} widthClass="w-auto" tooltipClassName="whitespace-nowrap">
      <span
        class="inline-flex items-center justify-center text-fg-muted hover:text-body focus-within:text-body"
        tabindex="0"
        aria-label=${s}
      >
        <${n} className="w-3.5 h-3.5" />
      </span>
    </${yt}>
  `},$3=({envVar:t,onChange:e,onDelete:n,disabled:s})=>{let o=b3(t),r=x3(t);return Ue`
    <div class="flex items-start gap-4 px-4 py-3">
      <div class="shrink-0" style="width: 200px">
        <div class="flex items-center gap-2 pt-1.5">
          <span
            class="inline-block w-1.5 h-1.5 rounded-full shrink-0 ${t.value?"bg-green-500":"bg-gray-600"}"
          />
          <code class="text-sm truncate">${t.key}</code>
        </div>
        ${r.length>0?Ue`
              <div class="flex items-center gap-2 mt-1 pl-3.5">
                ${r.map(i=>Ue`<${v3} key=${i} feature=${i} />`)}
              </div>
            `:null}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1">
          <${Rt}
            value=${t.value}
            onInput=${i=>e(t.key,i.target.value)}
            placeholder=${t.value?"":"not set"}
            isSecret=${!!t.value}
            inputClass="flex-1 min-w-0 bg-field border border-border rounded-lg px-3 py-1.5 text-sm text-body outline-none focus:border-fg-muted font-mono"
            disabled=${s}
          />
          ${t.group==="custom"?Ue`<button
                onclick=${()=>n(t.key)}
                class="text-fg-dim hover:text-status-error-muted px-1 text-xs shrink-0"
                title="Delete"
              >
                ✕
              </button>`:null}
        </div>
        ${o?Ue`<p class="text-xs text-fg-dim mt-1">${o}</p>`:null}
      </div>
    </div>
  `},kw=({onRestartRequired:t=()=>{}})=>{let[e,n]=y([]),[s,o]=y(()=>new Set),[r,i]=y([]),[a,l]=y(0),[c,d]=y(!1),[u,p]=y(!1),[f,g]=y(!1),[m,h]=y(""),b=ee("[]"),{data:x,error:v,loading:w,refresh:$}=ct("/api/env",Vr,{maxAgeMs:3e4}),S=q(j=>{if(!j)return;let X=m3(j.vars||[]);b.current=$w(X),n(X),i([]),o(new Set(j.reservedKeys||[])),j.restartRequired&&t(!0)},[t]),C=q(async()=>{try{let j=await $({force:!0});S(j)}catch(j){console.error("Failed to load env vars:",j)}},[S,$]);L(()=>{x&&(c||u||S(x))},[S,c,x,u]),L(()=>{v&&console.error("Failed to load env vars:",v)},[v]),L(()=>{d($w(e)!==b.current)},[e]);let _=(j,X)=>{n(de=>de.map(le=>le.key===j?{...le,value:X}:le))},k=j=>{n(X=>X.filter(de=>de.key!==j)),i(X=>X.filter(de=>de!==j))},A=async()=>{if(!u){p(!0);try{let j=e.filter(ie=>ie.editable&&!gc(ie?.key)).map(ie=>({key:ie.key,value:ie.value})),de=!!(await dd(j))?.restartRequired;de&&t(!0),N(de?"Environment variables saved. Restart gateway to apply.":"Environment variables saved","success");let le=await $({force:!0});S(le),l(ie=>ie+1),d(!1)}catch(j){N("Failed to save: "+j.message,"error")}finally{p(!1)}}},[O,D]=y(""),z=j=>{let X=j.split(`
`).map(le=>le.trim()).filter(Boolean).filter(le=>!le.startsWith("#")),de=[];for(let le of X){let ie=le.indexOf("=");ie>0&&de.push({key:le.slice(0,ie).trim(),value:h3(le.slice(ie+1))})}return de},E=j=>{let X=0,de=[],le=[],ie=[];return n(ne=>{let xe=[...ne];for(let{key:he,value:ue}of j){let me=vw(he);if(!me)continue;if(gc(me)){le.push(me);continue}if(s.has(me)){de.push(me);continue}let V=xe.find(J=>J.key===me);V?V.value=ue:(xe.push({key:me,value:ue,label:me,group:"custom",hint:"",source:"env_file",editable:!0}),ie.push(me)),X++}return xe}),ie.length&&i(ne=>[...ne,...ie]),{added:X,blocked:de,managedChannelKeys:le}},M=(j,X)=>{let de=(j.clipboardData||window.clipboardData).getData("text"),le=z(de);if(le.length>1){j.preventDefault();let{added:ie,blocked:ne,managedChannelKeys:xe}=E(le);if(h(""),D(""),ne.length){let he=Array.from(new Set(ne));N(`Reserved vars can't be added: ${he.join(", ")}`,"error")}if(xe.length){let he=Array.from(new Set(xe));N(`Channel tokens are managed from Channels: ${he.join(", ")}`,"error")}ie&&N(`Added ${ie} variable${ie!==1?"s":""}`,"success");return}if(le.length===1){j.preventDefault(),h(le[0].key),D(le[0].value);return}},R=j=>{let X=z(j);if(X.length===1){h(X[0].key),D(X[0].value);return}h(j)},B=j=>{let X=z(j);if(X.length===1){h(X[0].key),D(X[0].value);return}D(j)},I=()=>{let j=vw(m);if(j){if(gc(j)){N(`Channel tokens are managed from Channels: ${j}`,"error");return}if(s.has(j)){N(`Reserved var can't be added: ${j}`,"error");return}E([{key:j,value:O}]),h(""),D("")}},U=e.filter(j=>!gc(j?.key)),W={};for(let j of U){let X=j.group||"custom";W[X]||(W[X]=[]),W[X].push(j)}if(W.custom?.length){let j=new Set(r),X=W.custom.filter(le=>!j.has(le.key)).sort((le,ie)=>String(le?.key||"").localeCompare(String(ie?.key||""))),de=W.custom.filter(le=>j.has(le.key));W.custom=[...X,...de]}let G=y3(W.ai||[]),se=j=>j.map(X=>Ue`<${$3}
          key=${`${a}:${X.key}`}
          envVar=${X}
          onChange=${_}
          onDelete=${k}
          disabled=${u}
        />`),K=j=>{let X=W[j]||[];if(!X.length)return null;if(j==="ai"){let{visible:de,hidden:le}=G,ie=f&&le.length>0;return Ue`
        <div class="bg-surface border border-border rounded-xl overflow-hidden">
          <h3 class="card-label text-xs px-4 pt-3 pb-2">
            ${yw[j]||j}
          </h3>
          <div class="divide-y divide-border">${se(de)}</div>
          ${le.length>0?Ue`
                <div class="border-t border-border px-4 py-2">
                  <button
                    type="button"
                    onclick=${()=>g(ne=>!ne)}
                    class="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-body"
                  >
                    <${Ca}
                      className=${`transition-transform ${ie?"rotate-180":""}`}
                    />
                    ${ie?"Show fewer":`Show more (${le.length})`}
                  </button>
                </div>
              `:null}
          ${ie?Ue`<div class="divide-y divide-border border-t border-border">
                ${se(le)}
              </div>`:null}
        </div>
      `}return Ue`
      <div class="bg-surface border border-border rounded-xl overflow-hidden">
        <h3 class="card-label text-xs px-4 pt-3 pb-2">
          ${yw[j]||j}
        </h3>
        <div class="divide-y divide-border">${se(X)}</div>
      </div>
    `};return w&&!e.length?Ue`
      <${zn}
        header=${Ue`<${Ne} title="Envars" />`}
      >
        <div class="bg-surface border border-border rounded-xl p-4 text-sm text-fg-muted">
          Loading environment variables...
        </div>
      </${zn}>
    `:Ue`
    <${zn}
      header=${Ue`
        <${Ne}
          title="Envars"
          actions=${Ue`
            <${Qn} visible=${c}>
              <${Z}
                onClick=${C}
                disabled=${u}
                tone="secondary"
                size="sm"
                idleLabel="Cancel"
                className="text-xs"
              />
              <${Z}
                onClick=${A}
                disabled=${u}
                loading=${u}
                loadingMode="inline"
                tone="primary"
                size="sm"
                idleLabel="Save changes"
                loadingLabel="Saving…"
                className="text-xs"
              />
            </${Qn}>
          `}
        />
      `}
    >
      ${u3.filter(j=>W[j]?.length).map(j=>K(j))}

      <div
        class="bg-surface border border-border rounded-xl overflow-hidden"
      >
        <div class="flex items-center justify-between px-4 pt-3 pb-2">
          <h3 class="card-label text-xs">Add Variable</h3>
          <span class="text-xs" style="color: var(--text-dim)"
            >Paste KEY=VALUE or multiple lines</span
          >
        </div>
        <div
          class="flex items-start gap-4 px-4 py-3 border-t border-border"
        >
          <div class="shrink-0" style="width: 200px">
            <input
              type="text"
              value=${m}
              placeholder="KEY"
              onInput=${j=>R(j.target.value)}
              onPaste=${j=>M(j,"key")}
              onKeyDown=${j=>j.key==="Enter"&&I()}
              class="w-full bg-field border border-border rounded-lg px-3 py-1.5 text-sm text-body outline-none focus:border-fg-muted font-mono uppercase"
            />
          </div>
          <div class="flex-1 flex gap-2">
            <input
              type="text"
              value=${O}
              placeholder="value"
              onInput=${j=>B(j.target.value)}
              onPaste=${j=>M(j,"val")}
              onKeyDown=${j=>j.key==="Enter"&&I()}
              class="flex-1 bg-field border border-border rounded-lg px-3 py-1.5 text-sm text-body outline-none focus:border-fg-muted font-mono"
            />
            <button
              onclick=${I}
              class="text-xs px-3 py-1.5 rounded-lg border border-border text-fg-muted hover:text-body hover:border-fg-muted shrink-0"
            >
              + Add
            </button>
          </div>
        </div>
      </div>
    </${zn}>
  `};var w3=P.bind(T),uf=({onRestartRequired:t=()=>{}})=>w3`
  <${kw} onRestartRequired=${t} />
`;var Qt=P.bind(T),k3=t=>{let e=Number(t||0);if(!Number.isFinite(e)||e<=0)return"0s";let n=Math.floor(e/1e3),s=Math.floor(n/86400),o=Math.floor(n/3600),r=Math.floor(n%3600/60),i=n%60;return s>0?`${s}d ${o%24}h ${r}m ${i}s`:o>0?`${o}h ${r}m ${i}s`:r>0?`${r}m ${i}s`:`${i}s`},S3=({label:t,currentVersion:e,fetchVersion:n,applyUpdate:s,updateInProgress:o=!1,onActionComplete:r=()=>{}})=>{let[i,a]=y(!1),[l,c]=y(e||null),[d,u]=y(null),[p,f]=y(!1),[g,m]=y(""),[h,b]=y(!1),[x,v]=y(!1),w=(()=>{try{return new URLSearchParams(window.location.search).get("simulateUpdate")==="1"}catch{return!1}})(),$=(()=>{if(!w)return null;try{return new URLSearchParams(window.location.search).get("simulateVersion")||"v0.0.0-preview"}catch{return"v0.0.0-preview"}})(),S=w||p,C=$||d,_=o||S,k=C?`Update to ${C}`:"Update",A="https://github.com/openclaw/openclaw/tags",O=S&&C;L(()=>{c(e||null)},[e]),L(()=>{let R=!0;return(async(I=!1)=>{try{let U=await n(I);if(!R)return;c(U.currentVersion||e||null),u(U.latestVersion||null),f(!!U.hasUpdate),m(U.ok?"":U.error||"")}catch(U){if(!R)return;m(U.message||"Could not check updates")}})(!1),()=>{R=!1}},[e,n]),L(()=>{if(o)return()=>{};let R=!0,B=setTimeout(async()=>{try{let I=await n(!0);if(!R)return;c(I.currentVersion||e||null),u(I.latestVersion||null),f(!!I.hasUpdate),m(I.ok?"":I.error||"")}catch{}},1200);return()=>{R=!1,clearTimeout(B)}},[o,e,n]),L(()=>{if(!S||!C){b(!1);return}b(!1)},[S,C]);let D=async()=>{let R=!!S;if(!(_?i||o:i)){a(!0),m("");try{let I=R?await s():await n(!0);c(I.currentVersion||l),u(I.latestVersion||null),f(!!I.hasUpdate),m(I.ok?"":I.error||""),R?I.ok?I.updated||I.restarting?N(I.restarting?`${t} updated \u2014 restarting...`:`Updated ${t} to ${I.currentVersion}`,"success"):N(`Already at latest ${t} version`,"success"):N(I.error||`${t} update failed`,"error"):I.hasUpdate&&I.latestVersion?N(`${t} update available: ${I.latestVersion}`,"warning"):N(`${t} is up to date`,"success"),await r({type:R?"update":"check",ok:!!I?.ok,result:I})}catch(I){m(I.message||(R?`Could not update ${t}`:"Could not check updates")),N(R?`Could not update ${t}`:"Could not check updates","error"),await r({type:R?"update":"check",ok:!1,error:I})}finally{a(!1)}}},z=()=>{if(!(_?i||o:i)){if(S&&C&&!h){v(!0);return}D()}},E=()=>{v(!1),D()},M=_?i||o:i;return Qt`
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs text-body truncate">
          <span class="text-fg-muted">${t}</span>${" "}${l?`${l}`:"..."}
        </p>
        ${g&&S&&Qt`<div
          class="mt-1 text-xs text-status-error bg-status-error-bg border border-status-error-border rounded-lg px-2 py-1"
        >
          ${g}
        </div>`}
      </div>
      <div class="flex items-center gap-3 shrink-0">
        ${S&&C&&Qt`
          <a
            href=${A}
            target="_blank"
            rel="noreferrer"
            onclick=${()=>b(!0)}
            class="hidden md:inline text-xs text-fg-muted hover:text-body transition-colors"
            >View changelog</a
          >
        `}
        ${O?Qt`
              <${tn}
                onClick=${z}
                loading=${M}
                warning=${_}
                idleLabel=${_?k:"Check updates"}
                loadingLabel=${_?"Updating...":"Checking..."}
                className="hidden md:inline-flex"
              />
            `:Qt`
              <${tn}
                onClick=${z}
                loading=${M}
                warning=${_}
                idleLabel=${_?k:"Check updates"}
                loadingLabel=${_?"Updating...":"Checking..."}
              />
            `}
      </div>
    </div>
    ${O&&Qt`
      <div class="mt-2 md:hidden flex items-center gap-2">
        <a
          href=${A}
          target="_blank"
          rel="noreferrer"
          onclick=${()=>b(!0)}
          class="inline-flex items-center justify-center flex-1 h-9 text-xs rounded-lg border border-border text-fg-muted hover:text-body hover:border-fg-muted transition-colors"
          >View changelog</a
        >
        <${tn}
          onClick=${z}
          loading=${M}
          warning=${_}
          idleLabel=${k}
          loadingLabel="Updating..."
          className="flex-1 h-9 px-3"
        />
      </div>
    `}
    <${st}
      visible=${x}
      title="Update without changelog?"
      message="Are you sure you want to update without viewing the changelog?"
      confirmLabel=${`Update to ${C||"latest"}`}
      cancelLabel="Cancel"
      confirmTone="warning"
      onCancel=${()=>v(!1)}
      onConfirm=${E}
    />
  `},bc=({status:t,openclawVersion:e,restarting:n=!1,onRestart:s,watchdogStatus:o=null,onOpenWatchdog:r,onRepair:i,repairing:a=!1,openclawUpdateInProgress:l=!1,onOpenclawVersionActionComplete:c=()=>{},onOpenclawUpdate:d=ma})=>{let[u,p]=y(()=>Date.now()),f=t==="running"&&!n,g=f?"ac-status-dot ac-status-dot--healthy":"w-2 h-2 rounded-full bg-yellow-500 animate-pulse",m=o?.lifecycle==="crash_loop"?"crash_loop":o?.health,h=m==="healthy"?"ac-status-dot ac-status-dot--healthy ac-status-dot--healthy-offset":m==="degraded"?"bg-yellow-500":m==="unhealthy"||m==="crash_loop"?"bg-red-500":"bg-gray-500",b=m==="unknown"?"initializing":m||"unknown",x=a||!!o?.operationInProgress,v=m==="degraded"&&!!r,w=x||o?.health==="degraded"&&!r||o?.lifecycle==="crash_loop"||o?.health==="unhealthy"||o?.health==="crashed",$=F(()=>{let S=o?.uptimeStartedAt?Date.parse(o.uptimeStartedAt):null;return Number.isFinite(S)?Math.max(0,u-S):o?.uptimeMs||0},[o?.uptimeStartedAt,o?.uptimeMs,u]);return L(()=>{let S=setInterval(()=>{p(Date.now())},1e3);return()=>clearInterval(S)},[]),Qt` <div class="bg-surface border border-border rounded-xl p-4">
    <div class="space-y-2">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0 flex items-center gap-2 text-sm">
          <span class=${g}></span>
          <span class="font-semibold">Gateway:</span>
          <span class="text-fg-muted"
            >${n?"restarting...":t||"checking..."}</span
          >
        </div>
        <div class="flex items-center gap-3 shrink-0">
          ${!n&&f?Qt`
                <span class="text-xs text-fg-muted whitespace-nowrap"
                  >Uptime: ${k3($)}</span
                >
              `:null}
          <${tn}
            onClick=${s}
            disabled=${!t}
            loading=${n}
            warning=${!1}
            idleLabel="Restart"
            loadingLabel="On it..."
          />
        </div>
      </div>
      <div class="flex items-center justify-between gap-3">
        ${r?Qt`
              <button
                class="inline-flex items-center gap-2 text-sm hover:opacity-90"
                onclick=${r}
                title="Open Watchdog tab"
              >
                <span
                  class=${h.startsWith("ac-status-dot")?h:`w-2 h-2 rounded-full ${h}`}
                ></span>
                <span class="font-semibold">Watchdog:</span>
                <span class="text-fg-muted">${b}</span>
              </button>
            `:Qt`
              <div class="inline-flex items-center gap-2 text-sm">
                <span
                  class=${h.startsWith("ac-status-dot")?h:`w-2 h-2 rounded-full ${h}`}
                ></span>
                <span class="font-semibold">Watchdog:</span>
                <span class="text-fg-muted">${b}</span>
              </div>
            `}
        ${i?Qt`
              <div class="shrink-0 w-32 flex justify-end">
                ${v?Qt`
                      <${tn}
                        onClick=${r}
                        warning=${!1}
                        idleLabel="Inspect"
                        loadingLabel="Inspect"
                        className="w-full justify-center"
                      />
                    `:w?Qt`
                        <${tn}
                          onClick=${i}
                          loading=${x}
                          warning=${!0}
                          idleLabel="Repair"
                          loadingLabel="Repairing..."
                          className="w-full justify-center"
                        />
                      `:Qt`<span
                        class="inline-flex h-7 w-full"
                        aria-hidden="true"
                      ></span>`}
              </div>
            `:null}
      </div>
    </div>
    <div class="mt-3">
      <${S3}
        label="OpenClaw"
        currentVersion=${e}
        fetchVersion=${mm}
        applyUpdate=${d}
        updateInProgress=${l}
        onActionComplete=${c}
      />
    </div>
  </div>`};var $r=P.bind(T),C3={webchat:"Browser",cli:"CLI"},_3=t=>C3[t.clientMode]||t.clientId||"Device",M3=t=>{let e=[];return t.platform&&e.push(t.platform),t.role&&e.push(t.role),e.join(" \xB7 ")},A3=({d:t,onApprove:e,onReject:n})=>{let[s,o]=y(null),r=async l=>{o(l);try{l==="approve"?await e(t.id):await n(t.id)}catch{o(null)}},i=_3(t),a=M3(t);return s==="approve"?$r`
      <div class="bg-field rounded-lg p-3 mb-2 flex items-center gap-2">
        <span class="text-status-success text-sm">Approved</span>
        <span class="text-fg-muted text-xs">${i}</span>
      </div>`:s==="reject"?$r`
      <div class="bg-field rounded-lg p-3 mb-2 flex items-center gap-2">
        <span class="text-fg-muted text-sm">Rejected</span>
        <span class="text-fg-muted text-xs">${i}</span>
      </div>`:$r`
    <div class="bg-field rounded-lg p-3 mb-2">
      <div class="flex items-center gap-2 mb-2">
        <span class="font-medium text-sm">${i}</span>
        ${a&&$r`<span class="text-xs text-fg-muted">${a}</span>`}
      </div>
      <div class="flex gap-2">
        <${Z}
          onClick=${()=>r("approve")}
          tone="success"
          size="sm"
          idleLabel="Approve"
          className="font-medium px-3 py-1.5"
        />
        <${Z}
          onClick=${()=>r("reject")}
          tone="secondary"
          size="sm"
          idleLabel="Reject"
          className="font-medium px-3 py-1.5"
        />
      </div>
    </div>`},xc=({pending:t,onApprove:e,onReject:n})=>!t||t.length===0?null:$r`
    <div class="mt-3 pt-3 border-t border-border">
      <p class="text-xs text-fg-muted mb-2">Pending device pairings</p>
      ${t.map(s=>$r`<${A3} key=${s.id} d=${s} onApprove=${e} onReject=${n} />`)}
    </div>`;var fo=P.bind(T),Vi=[{key:"gmail",icon:"\u{1F4E7}",label:"Gmail",defaultRead:!0,defaultWrite:!1},{key:"calendar",icon:"\u{1F4C5}",label:"Calendar",defaultRead:!0,defaultWrite:!0},{key:"drive",icon:"\u{1F4C1}",label:"Drive",defaultRead:!0,defaultWrite:!1},{key:"sheets",icon:"\u{1F4CA}",label:"Sheets",defaultRead:!0,defaultWrite:!1},{key:"docs",icon:"\u{1F4DD}",label:"Docs",defaultRead:!0,defaultWrite:!1},{key:"tasks",icon:"\u2705",label:"Tasks",defaultRead:!1,defaultWrite:!1},{key:"contacts",icon:"\u{1F464}",label:"Contacts",defaultRead:!1,defaultWrite:!1},{key:"meet",icon:"\u{1F3A5}",label:"Meet",defaultRead:!1,defaultWrite:!1}],T3={gmail:"gmail.googleapis.com",calendar:"calendar-json.googleapis.com",tasks:"tasks.googleapis.com",drive:"drive.googleapis.com",contacts:"people.googleapis.com",sheets:"sheets.googleapis.com",docs:"docs.googleapis.com",meet:"meet.googleapis.com"};function Sw(t){return`https://console.developers.google.com/apis/api/${T3[t]||""}/overview`}function Cw({scopes:t,onToggle:e,apiStatus:n,loading:s}){let[o,r]=y(!1),i=n||{},a=5,l=Vi.length>a,c=o?Vi:Vi.slice(0,a);return fo`<div class="space-y-2">
    ${c.map(d=>{let u=t.includes(`${d.key}:read`),p=t.includes(`${d.key}:write`),f=i[d.key],g=null;return s&&!f&&(u||p)?g=fo`<span class="text-fg-muted text-xs flex items-center gap-1"><span class="inline-block w-3 h-3 border-2 border-fg-muted border-t-transparent rounded-full ac-spinner"></span></span>`:f&&(f.status==="ok"?g=fo`<a href=${f.enableUrl||Sw(d.key)} target="_blank" class="text-status-success-muted hover:text-status-success text-xs px-1.5 py-0.5 rounded bg-green-500/10">API ✓</a>`:f.status==="not_enabled"?g=fo`<a href=${f.enableUrl} target="_blank" class="text-status-error-muted hover:text-status-error text-xs underline">Enable API</a>`:f.status==="error"&&(g=fo`<a href=${f.enableUrl||Sw(d.key)} target="_blank" class="text-status-warning-muted hover:text-status-warning text-xs underline">Enable API</a>`)),fo`
        <div class="flex items-center justify-between bg-field rounded-lg px-3 py-2">
          <span class="text-sm">${d.icon} ${d.label}</span>
          <div class="flex items-center gap-2">
            ${g}
            <button onclick=${()=>e(`${d.key}:read`)} class="scope-btn scope-btn-read ${u?"active":""} text-xs px-2 py-0.5 rounded">Read</button>
            <button onclick=${()=>e(`${d.key}:write`)} class="scope-btn scope-btn-write ${p?"active":""} text-xs px-2 py-0.5 rounded">Write</button>
          </div>
        </div>`})}
    ${l?fo`
      <button
        type="button"
        onclick=${()=>r(d=>!d)}
        class="ml-3 text-xs text-fg-muted hover:text-body"
      >
        ${o?"Show fewer services":`Show more services (${Vi.length-a})`}
      </button>
    `:null}
  </div>`}function _w(t,e){let n=t.includes(e),s=n?t.filter(o=>o!==e):[...t,e];if(e.endsWith(":write")&&!n){let o=e.replace(":write",":read");s.includes(o)||s.push(o)}if(e.endsWith(":read")&&n){let o=e.replace(":read",":write");s=s.filter(r=>r!==o)}return s}function wr(){let t=[];for(let e of Vi)e.defaultRead&&t.push(`${e.key}:read`),e.defaultWrite&&t.push(`${e.key}:write`);return t}var kr=P.bind(T),Mw=({visible:t,onClose:e,onSaved:n,title:s="Connect Google Workspace",submitLabel:o="Connect Google",defaultInstrType:r="workspace",client:i="default",personal:a=!1,accountId:l="",initialValues:c={}})=>{let[d,u]=y(""),[p,f]=y(""),[g,m]=y(""),[h,b]=y(""),[x,v]=y(!1),[w,$]=y(r),[S,C]=y(!1),_=ee(null);if(L(()=>{t&&(u(String(c.clientId||"")),f(String(c.clientSecret||"")),m(String(c.email||"")),$(r),b(""),C(!1))},[t,c,r]),!t)return null;let k=`${window.location.origin}/auth/google/callback`,A=async()=>{try{await navigator.clipboard.writeText(k),C(!0),window.setTimeout(()=>C(!1),1500)}catch{b("Unable to copy redirect URI")}},O=async R=>{let B=R.target.files[0];if(B)try{let I=await B.text(),U=JSON.parse(I),W=U.installed||U.web||U;W.client_id&&u(W.client_id),W.client_secret&&f(W.client_secret)}catch{b("Invalid JSON file")}},D=async()=>{if(b(""),!d||!p||!g){b("Client ID, Client Secret, and Email are required");return}v(!0);try{let R=await zh({clientId:d,clientSecret:p,email:g,client:i,personal:a,accountId:l});R.ok?(e(),n?.(R.account)):b(R.error||"Failed to save credentials")}catch{b("Request failed")}finally{v(!1)}},z=R=>`flex-1 text-center border-0 cursor-pointer transition-colors ${w===R?"":"hover:text-white"}`,E=R=>"font-family: inherit; font-size: 11px; letter-spacing: 0.03em; padding: 5px 10px;"+(w===R?" color: var(--accent); background: var(--bg-active);":" color: var(--text-muted); background: transparent;"),M=()=>kr`
    <div class="mt-1 flex items-center gap-2">
      <input
        type="text"
        readonly
        value=${k}
        onFocus=${R=>R.target.select()}
        onclick=${R=>R.target.select()}
        class="flex-1 min-w-0 bg-field border border-border rounded px-2 py-1 text-body text-xs focus:outline-none focus:border-fg-muted"
      />
      <button
        type="button"
        onclick=${A}
        class="shrink-0 px-2 py-1 rounded border border-border text-xs text-body hover:border-fg-muted"
      >
        ${S?"Copied":"Copy"}
      </button>
    </div>
  `;return kr` <${De}
    visible=${t}
    onClose=${e}
    closeOnOverlayClick=${!1}
    panelClassName="bg-modal border border-border rounded-xl p-6 max-w-lg w-full space-y-4"
  >
      <${Ne}
        title=${s}
        actions=${kr`
          <button
            type="button"
            onclick=${e}
            class="h-8 w-8 inline-flex items-center justify-center rounded-lg ac-btn-secondary"
            aria-label="Close modal"
          >
            <${nt} className="w-3.5 h-3.5 text-body" />
          </button>
        `}
      />
      <div class="space-y-3">
        <div>
          <p class="text-fg-muted text-sm mb-3">
            You'll need a Google Cloud OAuth app.${" "}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              class="hover:text-white"
              style="color: rgba(99, 235, 255, 0.6)"
              >Create one →</a
            >
          </p>
          <details
            class="text-sm text-fg-muted mb-3 bg-field border border-border rounded-lg px-3 py-2"
          >
            <summary class="cursor-pointer font-medium hover:text-body">
              Step-by-step instructions
            </summary>
            <div
              class="mt-2 mb-2 flex overflow-hidden"
              style="border: 1px solid var(--border); border-radius: 6px; background: rgba(255,255,255,0.02)"
            >
              <button
                onclick=${()=>$("workspace")}
                class=${z("workspace")}
                style=${E("workspace")}
              >
                Google Workspace
              </button>
              <button
                onclick=${()=>$("personal")}
                class=${z("personal")}
                style=${E("personal")}
              >
                Personal Gmail
              </button>
            </div>
            ${w==="personal"?kr`
                  <div style="line-height: 1.7">
                    <ol class="list-decimal list-inside space-y-2.5 ml-1">
                      <li>
                        ${" "}<a
                          href="https://console.cloud.google.com/projectcreate"
                          target="_blank"
                          class="hover:text-white"
                          style="color: rgba(99, 235, 255, 0.6)"
                          >Create a Google Cloud project</a
                        >${" "}(or use existing)
                      </li>
                      <li>
                        Go to${" "}<a
                          href="https://console.cloud.google.com/auth/audience"
                          target="_blank"
                          class="hover:text-white"
                          style="color: rgba(99, 235, 255, 0.6)"
                          >OAuth consent screen</a
                        >${" "}→ set to <strong>External</strong>
                      </li>
                      <li>
                        Under${" "}<a
                          href="https://console.cloud.google.com/auth/audience"
                          target="_blank"
                          class="hover:text-white"
                          style="color: rgba(99, 235, 255, 0.6)"
                          >Test users</a
                        >, <strong>add your own email</strong>
                      </li>
                      <li>
                        ${" "}<a
                          href="https://console.cloud.google.com/apis/library"
                          target="_blank"
                          class="hover:text-white"
                          style="color: rgba(99, 235, 255, 0.6)"
                          >Enable APIs</a
                        >${" "}for the services you selected below
                      </li>
                      <li>
                        Go to${" "}<a
                          href="https://console.cloud.google.com/apis/credentials"
                          target="_blank"
                          class="hover:text-white"
                          style="color: rgba(99, 235, 255, 0.6)"
                          >Credentials</a
                        >${" "}→ Create OAuth 2.0 Client ID (Web application)
                      </li>
                      <li>
                        Add redirect URI:${M()}
                      </li>
                      <li>
                        Copy Client ID + Secret (or download credentials JSON)
                      </li>
                    </ol>
                    <p class="mt-3 text-status-warning-muted/80">
                      ⚠️ App will be in "Testing" mode. Only emails added as
                      Test Users can sign in (up to 100).
                    </p>
                  </div>
                `:kr`
                  <div style="line-height: 1.7">
                    <ol class="list-decimal list-inside space-y-2.5 ml-1">
                      <li>
                        ${" "}<a
                          href="https://console.cloud.google.com/projectcreate"
                          target="_blank"
                          class="hover:text-white"
                          style="color: rgba(99, 235, 255, 0.6)"
                          >Create a Google Cloud project</a
                        >${" "}(or use existing)
                      </li>
                      <li>
                        Go to${" "}<a
                          href="https://console.cloud.google.com/auth/audience"
                          target="_blank"
                          class="hover:text-white"
                          style="color: rgba(99, 235, 255, 0.6)"
                          >OAuth consent screen</a
                        >${" "}→ set to <strong>Internal</strong> (Workspace
                        only)
                      </li>
                      <li>
                        ${" "}<a
                          href="https://console.cloud.google.com/apis/library"
                          target="_blank"
                          class="hover:text-white"
                          style="color: rgba(99, 235, 255, 0.6)"
                          >Enable APIs</a
                        >${" "}for the services you selected below
                      </li>
                      <li>
                        Go to${" "}<a
                          href="https://console.cloud.google.com/apis/credentials"
                          target="_blank"
                          class="hover:text-white"
                          style="color: rgba(99, 235, 255, 0.6)"
                          >Credentials</a
                        >${" "}→ Create OAuth 2.0 Client ID (Web application)
                      </li>
                      <li>
                        Add redirect URI:${M()}
                      </li>
                      <li>
                        Copy Client ID + Secret (or download credentials JSON)
                      </li>
                    </ol>
                    <p class="mt-3 text-status-success-muted/80">
                      ✓ Internal apps skip test users and verification. Only
                      users in your Workspace org can authorize this Google app.
                    </p>
                  </div>
                `}
          </details>
        </div>
        <div
          class="bg-field border border-border rounded-lg p-3 space-y-3 mt-2"
        >
          <div class="flex flex-col items-center text-center gap-2 py-2">
            <label class="text-sm text-body font-medium"
              >Upload credentials.json</label
            >
            <input
              type="file"
              ref=${_}
              accept=".json"
              onchange=${O}
              class="hidden"
            />
            <button
              type="button"
              onclick=${()=>_.current?.click()}
              class="text-sm px-3 py-1.5 rounded-lg border border-border text-body hover:border-fg-muted"
            >
              Choose file
            </button>
          </div>
          <div class="flex items-center gap-3 py-1">
            <div class="h-px flex-1 bg-border"></div>
            <span class="text-fg-muted text-xs">or enter manually</span>
            <div class="h-px flex-1 bg-border"></div>
          </div>
          <div>
            <label class="text-sm text-fg-muted block mb-1">Client ID</label>
            <${Rt}
              value=${d}
              onInput=${R=>u(R.target.value)}
              placeholder="xxxx.apps.googleusercontent.com"
              inputClass="flex-1 bg-field border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fg-muted"
            />
          </div>
          <div>
            <label class="text-sm text-fg-muted block mb-1"
              >Client Secret</label
            >
            <${Rt}
              value=${p}
              onInput=${R=>f(R.target.value)}
              placeholder="GOCSPX-..."
              inputClass="flex-1 bg-field border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fg-muted"
            />
          </div>
          <div>
            <label class="text-sm text-fg-muted block mb-1"
              >Email (Google account to authorize)</label
            >
            <input
              type="email"
              value=${g}
              onInput=${R=>m(R.target.value)}
              placeholder="you@gmail.com"
              class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fg-muted"
            />
          </div>
        </div>
      </div>
      <div class="flex gap-2 pt-2">
        <${Z}
          onClick=${D}
          disabled=${x}
          loading=${x}
          tone="primary"
          size="lg"
          idleLabel=${o}
          loadingLabel="Saving..."
          className="w-full px-4 py-2 rounded-lg text-sm"
        />
      </div>
      ${h?kr`<div class="text-status-error-muted text-xs">${h}</div>`:null}
  </${De}>`};var Aw=P.bind(T),P3=({watchStatus:t,busy:e=!1})=>e?{label:t?.enabled?"Stopping":"Starting",tone:"warning"}:t?.enabled?t.enabled&&!t.running?{label:"Error",tone:"danger"}:{label:"Watching",tone:"success"}:{label:"Stopped",tone:"neutral"},Tw=({account:t,watchStatus:e=null,busy:n=!1,onEnable:s=()=>{},onDisable:o=()=>{},onOpenWebhook:r=()=>{}})=>{if(!(Array.isArray(t?.activeScopes)?t.activeScopes.includes("gmail:read"):Array.isArray(t?.services)?t.services.includes("gmail:read"):!1))return Aw`
      <div class="bg-field rounded-lg px-3 py-2">
        <div class="text-xs text-fg-muted">
          Gmail watch requires <code>gmail:read</code>. Add it in permissions
          above, then update permissions.
        </div>
      </div>
    `;let a=P3({watchStatus:e,busy:n}),l=!!e?.enabled;return Aw`
    <div
      class="flex items-center justify-between bg-field border border-transparent rounded-lg px-3 py-2 cursor-pointer hover:bg-field hover:border-white/20 transition-colors"
      role="button"
      tabindex="0"
      onClick=${()=>r?.()}
      onKeyDown=${c=>{c.key!=="Enter"&&c.key!==" "||(c.preventDefault(),r?.())}}
    >
      <div class="flex items-center gap-1.5 text-sm">
        <span>🔔 Gmail</span>
        <${no}
          text="Watches this inbox for new email events and routes them to your agent via the Gmail hook."
          widthClass="w-72"
        />
      </div>
      <div
        class="flex items-center gap-2"
        onClick=${c=>c.stopPropagation()}
        onKeyDown=${c=>c.stopPropagation()}
      >
        <${ae} tone=${a.tone}>${a.label}</${ae}>
        <${vn}
          checked=${l}
          disabled=${n}
          label=""
          onChange=${c=>{n||(c?s?.():o?.())}}
        />
      </div>
    </div>
  `};var ji=P.bind(T),R3=(t=[],e=[])=>t.length===e.length&&t.every(n=>e.includes(n)),Pw=({account:t,personal:e=!1,expanded:n,onToggleExpanded:s,scopes:o=[],savedScopes:r=[],apiStatus:i={},checkingApis:a=!1,onToggleScope:l,onCheckApis:c,onUpdatePermissions:d,onEditCredentials:u,onDisconnect:p,gmailWatchStatus:f=null,gmailWatchBusy:g=!1,onEnableGmailWatch:m,onDisableGmailWatch:h,onOpenGmailSetup:b,onOpenGmailWebhook:x})=>{let v=!R3(o,r);return ji`
    <div class="border border-border rounded-lg bg-field overflow-visible">
      <button
        type="button"
        onclick=${()=>s?.(t.id)}
        class="w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-field"
      >
        <div class="min-w-0">
          <div class="text-sm font-medium truncate">${t.email}</div>
        </div>
        <div class="flex items-center gap-2">
          ${e?ji`<${ae} tone="neutral">Personal</${ae}>`:null}
          <${ae} tone=${t.authenticated?"success":"warning"}>
            ${t.authenticated?"Connected":"Awaiting sign-in"}
          </${ae}>
          <span class="text-xs text-fg-muted">${n?"\u25BE":"\u25B8"}</span>
        </div>
      </button>
      ${n?ji`
            <div class="px-3 pb-3 space-y-3 border-t border-border">
              <div class="flex justify-between items-center pt-3">
                <span class="text-sm text-fg-muted">Select permissions</span>
                ${t.authenticated?ji`<button
                      type="button"
                      onclick=${()=>c?.(t.id)}
                      disabled=${a}
                      class="text-xs px-2 py-1 rounded-lg ac-btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ${a?"Checking APIs...":"\u21BB Check APIs"}
                    </button>`:null}
              </div>
              <${Cw}
                scopes=${o}
                onToggle=${w=>l?.(t.id,w)}
                apiStatus=${t.authenticated?i:{}}
                loading=${t.authenticated&&a}
              />
              ${t.authenticated?ji`
                    <div class="-mx-3 mt-4 mb-2 border-y border-border">
                      <div class="px-3 py-3 space-y-2">
                        <div class="flex justify-between items-center gap-2">
                          <span class="text-sm text-fg-muted">Incoming events</span>
                          <button
                            type="button"
                            onclick=${()=>b?.(t.id)}
                            class="text-xs px-2 py-1 rounded-lg ac-btn-ghost"
                          >
                            Configure
                          </button>
                        </div>
                        <${Tw}
                          account=${t}
                          watchStatus=${f}
                          busy=${g}
                          onEnable=${()=>m?.(t.id)}
                          onDisable=${()=>h?.(t.id)}
                          onOpenWebhook=${()=>x?.()}
                        />
                      </div>
                    </div>
                  `:null}
              <div class="pt-1 space-y-2 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
                <div class="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
                  <button
                    type="button"
                    onclick=${()=>d?.(t.id)}
                    disabled=${t.authenticated&&!v}
                    class="w-full sm:w-auto text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ${t.authenticated?"Update Permissions":"Sign in with Google"}
                  </button>
                  <button
                    type="button"
                    onclick=${()=>u?.(t.id)}
                    class="w-full sm:w-auto text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-secondary"
                  >
                    Edit Credentials
                  </button>
                </div>
                <button
                  type="button"
                  onclick=${()=>p?.(t.id)}
                  class="text-xs px-2 py-1 rounded-lg ac-btn-ghost w-full sm:w-auto"
                >
                  Disconnect
                </button>
              </div>
            </div>
          `:null}
    </div>
  `};var pf=P.bind(T),Rw=({visible:t,onClose:e,onSubmit:n,loading:s=!1,defaultEmail:o="",title:r="Add Company Account"})=>{let[i,a]=y(""),[l,c]=y("");if(L(()=>{t&&(a(String(o||"")),c(""))},[t,o]),!t)return null;let d=async()=>{c("");let u=String(i||"").trim();if(!u){c("Email is required");return}await n?.({email:u,setError:c})};return pf`<${De}
    visible=${t}
    onClose=${e}
    closeOnOverlayClick=${!1}
    panelClassName="bg-modal border border-border rounded-xl p-6 max-w-md w-full space-y-4"
  >
    <${Ne}
      title=${r}
      actions=${pf`
        <button
          type="button"
          onclick=${e}
          class="h-8 w-8 inline-flex items-center justify-center rounded-lg ac-btn-secondary"
          aria-label="Close modal"
        >
          <${nt} className="w-3.5 h-3.5 text-body" />
        </button>
      `}
    />
    <div class="space-y-3">
      <div>
        <label class="text-sm text-fg-muted block mb-1"
          >Email (Google account to authorize)</label
        >
        <p class="text-xs text-fg-muted mb-2">
          This adds another account to the same company workspace. Only one company workspace is supported.
        </p>
        <input
          type="email"
          value=${i}
          onInput=${u=>a(u.target.value)}
          placeholder="you@company.com"
          class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fg-muted"
        />
      </div>
      ${l?pf`<div class="text-status-error-muted text-xs">${l}</div>`:null}
    </div>
    <div class="pt-2">
      <${Z}
        onClick=${d}
        disabled=${s}
        loading=${s}
        tone="primary"
        size="lg"
        idleLabel="Add Account"
        loadingLabel="Saving..."
        className="w-full px-4 py-2 rounded-lg text-sm"
      />
    </div>
  </${De}>`};var Lw=({gatewayStatus:t})=>{let e=ee(!1),{data:n,loading:s,refresh:o}=ct("/api/google/accounts",Wh,{maxAgeMs:3e4}),r=F(()=>Array.isArray(n?.accounts)?n.accounts:[],[n?.accounts]),i=!!n?.hasCompanyCredentials,a=!!n?.hasPersonalCredentials,l=q(async()=>o({force:!0}),[o]);return L(()=>{if(t!=="running"){e.current=!1;return}e.current||(e.current=!0,l().catch(()=>{}))},[t,l]),{accounts:r,loading:s,hasCompanyCredentials:i,hasPersonalCredentials:a,refreshAccounts:l}};var Ew=({gatewayStatus:t,accounts:e=[]})=>{let[n,s]=y({}),[o,r]=y(!1),i=F(()=>e.map(x=>String(x?.id||"").trim()).filter(Boolean).sort().join("|"),[e]),{data:a,loading:l,refresh:c}=ct("/api/gmail/config",Gh,{enabled:t==="running",maxAgeMs:3e4}),d=q(async()=>c({force:!0}),[c]);L(()=>{t==="running"&&e.length&&d().catch(()=>{})},[i,e.length,t,d]);let u=F(()=>{let x=new Map;for(let v of a?.accounts||[])x.set(String(v.accountId||""),v);return x},[a]),p=F(()=>{let x=new Map;for(let v of a?.clients||[])x.set(String(v.client||"default"),v);return x},[a]),f=(x,v)=>{s(w=>{let $=String(x||"");if(!$)return w;if(v)return{...w,[$]:!0};if(!w[$])return w;let S={...w};return delete S[$],S})},g=q(async(x,{destination:v=null}={})=>{let w=String(x||"");f(w,!0);try{let $=await Jh(w,{destination:v});return await d(),$}finally{f(w,!1)}},[d]),m=q(async x=>{let v=String(x||"");f(v,!0);try{await Zh(v),await d()}finally{f(v,!1)}},[d]),h=q(async(x="")=>{let v=String(x||"");v&&f(v,!0);try{await Yh({accountId:v,force:!0}),await d()}finally{v&&f(v,!1)}},[d]),b=q(async({client:x="default",projectId:v="",regeneratePushToken:w=!1}={})=>{r(!0);try{let $=await qh({client:x,projectId:v,regeneratePushToken:w});return await d(),$}catch($){throw String($?.message||"").toLowerCase().includes("not found")?new Error("Gmail watch API route not found. Restart AlphaClaw so /api/gmail routes are loaded."):$}finally{r(!1)}},[d]);return{loading:l,config:a,watchByAccountId:u,clientConfigByClient:p,busyByAccountId:n,savingClient:o,refresh:d,saveClientSetup:b,startWatchForAccount:g,stopWatchForAccount:m,renewForAccount:h}};var mt=P.bind(T),L3=async t=>{let e=String(t||"");if(!e)return!1;try{if(navigator?.clipboard?.writeText)return await navigator.clipboard.writeText(e),!0}catch{}try{let n=document.createElement("textarea");return n.value=e,n.setAttribute("readonly",""),n.style.position="fixed",n.style.opacity="0",document.body.appendChild(n),n.select(),document.execCommand("copy"),document.body.removeChild(n),!0}catch{return!1}},Iw=["Install + Authenticate gcloud","Enable APIs","Create Topic + IAM","Create Push Subscription","Build with your Agent"],E3=Iw.slice(0,3),yc=Is,vc=(t="",e=()=>{})=>mt`
  <div class="rounded-lg border border-border bg-field p-3">
    <pre
      class="pt-1 pl-2 text-[11px] leading-5 whitespace-pre-wrap break-all font-mono text-body"
    >
${t}</pre
    >
    <div class="pt-3">
      <button
        type="button"
        onclick=${e}
        class="text-xs px-2 py-1 rounded-lg ac-btn-ghost"
      >
        Copy
      </button>
    </div>
  </div>
`,Dw=({visible:t=!1,account:e=null,clientConfig:n=null,saving:s=!1,onClose:o=()=>{},onSaveSetup:r=async()=>{},onFinish:i=async()=>{}})=>{let[a,l]=y(0),[c,d]=y(""),[u,p]=y(!1),[f,g]=y(""),[m,h]=y(!1),[b,x]=y(!1),[v,w]=y(!1),[$,S]=y(!1),[C,_]=y(!1),{selectedSessionKey:k,setSelectedSessionKey:A,loading:O,error:D}=yr({enabled:t,filter:pc}),{sessions:z,destinationSessionKey:E,setDestinationSessionKey:M,selectedDestination:R}=Ds({enabled:t,resetKey:String(e?.id||"")});L(()=>{t&&(l(0),g(""),d(""),p(!1),h(!1),x(!1),w(!1),S(!1),_(!!n?.webhookExists))},[t,e?.id]);let B=n?.commands||null,I=!!(String(n?.projectId||"").trim()||B),U=u||!I&&!m,W=String(c||"").trim()||String(n?.projectId||"").trim()||"<project-id>",G=C,se=G?E3:Iw,K=se.length,j=String(e?.client||n?.client||"default").trim()||"default",X=F(()=>U?String(c||"").trim().length>0:!0,[U,c]),de=q(async he=>{if(await L3(he)){N("Copied to clipboard","success");return}N("Could not copy text","error")},[]),le=q(()=>{g(""),d(String(n?.projectId||"").trim()),h(!1),p(!0)},[n?.projectId]),ie=async()=>{try{g(""),await i({client:j,projectId:String(c||"").trim(),destination:R}),x(!0),l(he=>Math.min(he+1,K-1))}catch(he){g(he.message||"Could not finish setup")}},ne=async()=>{if(!s){if(U){if(!X)return;g("");try{await r({client:j,projectId:String(c||"").trim()}),p(!1),h(!0)}catch(he){g(he.message||"Could not save project id");return}return}l(he=>Math.min(he+1,K-1))}},xe=async()=>{if(!(v||$))try{w(!0);let ue=`I just enabled Gmail watch for "${String(e?.email||"this account").trim()||"this account"}", set up the webhook, and created the transform file. Help me set up what I want to do with incoming email.`;await fa({message:ue,sessionKey:k}),S(!0),N("Message sent to your agent","success")}catch(he){N(he.message||"Could not send message to agent","error")}finally{w(!1)}};return mt`
    <${De}
      visible=${t}
      onClose=${o}
      closeOnOverlayClick=${!1}
      closeOnEscape=${!1}
      panelClassName="relative bg-modal border border-border rounded-xl p-6 max-w-2xl w-full space-y-4"
    >
      <button
        type="button"
        onclick=${o}
        class="absolute top-6 right-6 h-8 w-8 inline-flex items-center justify-center rounded-lg ac-btn-secondary"
        aria-label="Close modal"
      >
        <${nt} className="w-3.5 h-3.5 text-body" />
      </button>
      <div class="text-xs text-fg-muted">Gmail Pub / Sub Setup</div>
      <div class="flex items-center gap-1">
        ${se.map((he,ue)=>mt`
            <div
              class=${`h-1 flex-1 rounded-full transition-colors ${ue<=a?"bg-accent":"bg-border"}`}
              style=${ue<=a?"background: var(--accent)":""}
              title=${he}
            ></div>
          `)}
      </div>
      <${Ne}
        title=${`Step ${a+1} of ${K}: ${se[a]}`}
        actions=${null}
      />
      ${f?mt`<div class="text-xs text-status-error-muted">${f}</div>`:null}
      ${U?mt`
              <div
                class="rounded-lg border border-border bg-field p-3 space-y-2"
              >
                <div class="text-sm">
                  ${u?"Change project ID":"Project ID required"}
                </div>
                <div class="text-xs text-fg-muted">
                  Find it in the${" "}
                  <a
                    href="https://console.cloud.google.com/home/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    class="ac-tip-link"
                  >
                    Google Cloud Console Project Selector
                  </a>
                </div>
                <input
                  type="text"
                  value=${c}
                  oninput=${he=>d(he.target.value)}
                  class="w-full bg-field border border-border rounded-lg px-2.5 py-2 text-xs font-mono focus:border-fg-muted focus:outline-none"
                  placeholder="my-gcp-project"
                />
              </div>
            `:null}
      ${!U&&a===0?mt`
              <div class="space-y-1">
                <div class="text-xs text-fg-muted">
                  Using project <code>${W}</code>.
                </div>
                <div class="text-xs text-fg-muted">
                  If <code>gcloud</code> is not installed on your computer,
                  follow the official install guide:${" "}
                  <a
                    href="https://docs.cloud.google.com/sdk/docs/install-sdk"
                    target="_blank"
                    rel="noreferrer"
                    class="ac-tip-link"
                  >
                    Google Cloud SDK install docs
                  </a>
                </div>
              </div>
              ${vc(`gcloud auth login
gcloud config set project ${W}`,()=>de(`gcloud auth login
gcloud config set project ${W}`))}
            `:null}
      ${!U&&a===1?vc(B?.enableApis||"",()=>de(B?.enableApis||"")):null}
      ${!U&&a===2?mt`
              ${vc(`${B?.createTopic||""}

${B?.grantPublisher||""}`.trim(),()=>de(`${B?.createTopic||""}

${B?.grantPublisher||""}`.trim()))}
            `:null}
      ${!G&&!U&&a===3?mt`
              ${vc(B?.createSubscription||"",()=>de(B?.createSubscription||""))}
              <div
                class="rounded-lg border border-border bg-field p-3 space-y-2"
              >
                <${vr}
                  label="Deliver to"
                  sessions=${z}
                  selectedSessionKey=${E}
                  onChangeSessionKey=${M}
                  disabled=${G||O||s}
                  loading=${O}
                  error=${D}
                  allowNone=${!0}
                  noneValue=${yc}
                  noneLabel="Default"
                  loadingLabel="Loading sessions..."
                  helperText=${G?"This Gmail webhook has already been created. To edit delivery routing, ask your agent.":null}
                  selectClassName="w-full bg-field border border-border rounded-lg px-2.5 py-2 text-xs font-mono focus:border-fg-muted focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  helperClassName="text-xs text-fg-muted"
                  statusClassName="text-[11px] text-fg-muted"
                  errorClassName="text-[11px] text-status-error-muted"
                />
              </div>
            `:null}
      ${!G&&a===4?mt`
              <div
                class="rounded-lg border border-border bg-field p-3 space-y-3"
              >
                <div class="pt-1 space-y-1">
                  <div class="text-sm">Continue with your agent</div>
                  <div class="text-xs text-fg-muted">
                    Tell your OpenClaw agent about what you want to build with
                    incoming email to continue the setup.
                  </div>
                  <div class="pt-2 space-y-2">
                    <div class="text-[11px] text-fg-muted">
                      Send this to session
                    </div>
                    <div class="flex items-center gap-2">
                      <select
                        value=${k||yc}
                        oninput=${he=>{let ue=String(he.target.value||"");A(ue===yc?"":ue)}}
                        disabled=${O||v||$}
                        class="flex-1 min-w-0 bg-field border border-border rounded-lg px-2.5 py-2 text-xs font-mono focus:border-fg-muted focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ${k?null:mt`<option value=${yc}>
                              Select a session...
                            </option>`}
                        ${z.map(he=>mt`
                            <option value=${he.key}>
                              ${he.label||he.key}
                            </option>
                          `)}
                      </select>
                      <${Z}
                        onClick=${xe}
                        disabled=${!k||$}
                        loading=${v}
                        idleLabel=${$?"Sent":"Send to Agent"}
                        loadingLabel="Sending..."
                        tone="primary"
                        size="sm"
                        className="h-[34px] px-3"
                      />
                    </div>
                    ${O?mt`<div class="text-[11px] text-fg-muted">
                          Loading sessions...
                        </div>`:null}
                    ${D?mt`<div class="text-[11px] text-status-error-muted">
                          ${D}
                        </div>`:null}
                  </div>
                </div>
              </div>
            `:null}
      <div class="grid grid-cols-2 gap-2 pt-2">
        ${a===0?mt`${U?mt`<div></div>`:mt`<button
                    type="button"
                    onclick=${le}
                    class="justify-self-start text-xs px-2 py-1 rounded-lg ac-btn-ghost"
                  >
                    Change project ID
                  </button>`}`:mt`<${Z}
                onClick=${()=>l(he=>Math.max(he-1,0))}
                disabled=${s}
                idleLabel="Back"
                tone="secondary"
                size="md"
                className="w-full justify-center"
              />`}
        ${!G&&a===K-2?mt`<${Z}
                onClick=${ie}
                disabled=${!1}
                loading=${s}
                idleLabel="Enable watch"
                loadingLabel="Enabling..."
                tone="primary"
                size="md"
                className="w-full justify-center"
              />`:a<K-1?mt`<${Z}
                onClick=${ne}
                disabled=${s||U&&!X}
                idleLabel="Next"
                tone="primary"
                size="md"
                className="w-full justify-center"
              />`:mt`<${Z}
                onClick=${o}
                disabled=${s||v}
                idleLabel="Done"
                tone="secondary"
                size="md"
                className="w-full justify-center"
              />`}
      </div>
    </${De}>
  `};var Ns=P.bind(T),I3=(t=[],e=[])=>t.length!==e.length||t.some(n=>!e.includes(n)),$c=(t={})=>!!t.personal,D3="/assets/icons/google_icon.svg",Nw=({gatewayStatus:t,onRestartRequired:e=()=>{},onOpenGmailWebhook:n=()=>{}})=>{let{accounts:s,loading:o,hasCompanyCredentials:r,refreshAccounts:i}=Lw({gatewayStatus:t}),[a,l]=y(""),[c,d]=y({}),[u,p]=y({}),[f,g]=y({}),[m,h]=y({}),[b,x]=y(!1),[v,w]=y({visible:!1,accountId:"",client:"default",personal:!1,title:"Connect Google Workspace",submitLabel:"Connect Google",defaultInstrType:"workspace",initialValues:{}}),[$,S]=y(!1),[C,_]=y(!1),[k,A]=y(""),[O,D]=y({visible:!1,accountId:""}),{loading:z,watchByAccountId:E,clientConfigByClient:M,busyByAccountId:R,savingClient:B,refresh:I,saveClientSetup:U,startWatchForAccount:W,stopWatchForAccount:G}=Ew({gatewayStatus:t,accounts:s}),se=F(()=>s.some(Q=>$c(Q)),[s]),K=F(()=>s.some(Q=>!$c(Q)),[s]),j=q(Q=>s.find(pe=>pe.id===Q)||null,[s]),X=q(Q=>{let pe=Array.isArray(Q.activeScopes)&&Q.activeScopes.length?Q.activeScopes:Array.isArray(Q.services)&&Q.services.length?Q.services:wr();p(te=>({...te,[Q.id]:[...pe]})),d(te=>{let Ee=te[Q.id];return!Ee||!I3(Ee,pe)?{...te,[Q.id]:[...pe]}:te})},[]);L(()=>{if(!s.length){l("");return}let Q=s.find(pe=>!pe.authenticated)?.id||"";l(pe=>pe&&s.some(te=>te.id===pe)?pe:Q),s.forEach(pe=>X(pe))},[s,X]);let de=q(Q=>{let pe=j(Q);if(!pe)return;let te=c[Q]||pe.activeScopes||wr();if(!te.length){window.alert("Select at least one service");return}let Ee=`/auth/google/start?accountId=${encodeURIComponent(Q)}&services=${encodeURIComponent(te.join(","))}&_ts=${Date.now()}`,ke=window.open(Ee,`google-auth-${Q}`,"popup=yes,width=500,height=700");(!ke||ke.closed)&&(window.location.href=Ee)},[j,c]),le=(Q,pe)=>{d(te=>({...te,[Q]:_w(te[Q]||[],pe)}))},ie=q(async Q=>{g(pe=>{let te={...pe};return delete te[Q],te}),h({[Q]:!0});try{let pe=await jh(Q);pe.results&&g(te=>({...te,[Q]:pe.results}))}finally{h(pe=>{if(!pe[Q])return pe;let te={...pe};return delete te[Q],te})}},[]);L(()=>{let Q=async pe=>{if(pe.data?.google==="success"){N("\u2713 Google account connected","success");let te=String(pe.data?.accountId||"").trim();g({}),await i(),await I(),te&&await ie(te)}else pe.data?.google==="error"&&N(`\u2717 Google auth failed: ${pe.data.message||"unknown"}`,"error")};return window.addEventListener("message",Q),()=>window.removeEventListener("message",Q)},[ie,i,I]),L(()=>{!a||!j(a)?.authenticated||m[a]||f[a]||ie(a)},[s,f,m,a,j,ie]);let ne=async Q=>{let pe=await Kh(Q);if(!pe.ok){N(`Failed to disconnect: ${pe.error||"unknown"}`,"error");return}N("Google account disconnected","success"),g(te=>{let Ee={...te};return delete Ee[Q],Ee}),await i(),await I()},xe=({accountId:Q="",client:pe="default",personal:te=!1,title:Ee="Connect Google Workspace",submitLabel:ke="Connect Google",defaultInstrType:H=te?"personal":"workspace",initialValues:re={}})=>{w({visible:!0,accountId:Q,client:pe,personal:te,title:Ee,submitLabel:ke,defaultInstrType:H,initialValues:re})},he=()=>{w(Q=>({...Q,visible:!1}))},ue=async Q=>{Q?.id&&l(Q.id),await i(),Q?.id&&de(Q.id)},me=async({email:Q,setError:pe})=>{_(!0);try{let te=await Uh({email:Q,client:"default",personal:!1,services:wr()});if(!te.ok){pe?.(te.error||"Could not add account");return}S(!1),te.accountId&&l(te.accountId),await i(),te.accountId&&de(te.accountId)}finally{_(!1)}},V=()=>{if(x(!1),K&&r){S(!0);return}xe({client:"default",personal:!1,title:"Add Company Account",submitLabel:"Save Credentials",defaultInstrType:"workspace"})},J=()=>{x(!1),xe({client:"personal",personal:!0,title:"Add Personal Account",submitLabel:"Save Credentials",defaultInstrType:"personal"})},oe=async Q=>{let pe=j(Q);if(!pe)return;let te=$c(pe),Ee=te?"personal":pe.client||"default",ke={};try{let H=await Vh({accountId:pe.id,client:Ee});H?.ok&&(ke={clientId:String(H.clientId||""),clientSecret:String(H.clientSecret||"")})}catch{N("Could not load saved client credentials","warning")}xe({accountId:pe.id,client:Ee,personal:te,title:`Edit Credentials (${pe.email})`,submitLabel:"Save Credentials",defaultInstrType:te?"personal":"workspace",initialValues:{email:pe.email,...ke}})},ce=Q=>{D({visible:!0,accountId:String(Q||"")})},be=()=>{D({visible:!1,accountId:""})},Ve=async Q=>{let pe=j(Q);if(!pe)return;let te=String(pe.client||"default").trim()||"default",Ee=M.get(te);if(!Ee?.configured||!Ee?.webhookExists){ce(Q);return}try{(await W(Q))?.restartRequired&&e(!0),N("Gmail watch enabled","success")}catch(ke){N(ke.message||"Could not enable Gmail watch","error")}},et=async Q=>{try{await G(Q),N("Gmail watch disabled","info")}catch(pe){N(pe.message||"Could not disable Gmail watch","error")}},kt=async({client:Q,projectId:pe,destination:te=null})=>{let Ee=String(O.accountId||"").trim();Ee&&(await U({client:Q,projectId:pe,regeneratePushToken:!1}),await W(Ee,{destination:te}),N("Gmail setup complete and watch enabled","success"))},Ot=()=>Ns`
    <div class="text-center space-y-2 pt-3">
      <div class="rounded-lg border border-border bg-field px-3 py-5">
        <div class="flex flex-col items-center justify-center gap-3">
          <img
            src=${D3}
            alt="Google logo"
            class="h-5 w-5 shrink-0"
            loading="lazy"
            decoding="async"
          />
          <p class="text-xs text-fg-muted">
            Connect Gmail, Calendar, Contacts, Drive, Sheets, Tasks, Docs, and
            Meet.
          </p>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
        <${Z}
          onClick=${V}
          tone="primary"
          size="sm"
          idleLabel="Add Company Account"
          className="w-full font-medium"
        />
        <${Z}
          onClick=${J}
          tone="secondary"
          size="sm"
          idleLabel="Add Personal Account"
          className="w-full font-medium"
        />
      </div>
    </div>
  `;return Ns`
    <div class="bg-surface border border-border rounded-xl p-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="card-label">Google Accounts</h2>
        ${s.length?Ns`
              <div class="relative">
                <${pt}
                  open=${b}
                  ariaLabel="Add Google account"
                  title="Add Google account"
                  onClose=${()=>x(!1)}
                  onToggle=${()=>x(Q=>!Q)}
                  renderTrigger=${({onToggle:Q,ariaLabel:pe,title:te})=>Ns`
                    <${Z}
                      onClick=${Q}
                      tone="subtle"
                      size="sm"
                      idleLabel="+ Add Account"
                      ariaLabel=${pe}
                      title=${te}
                    />
                  `}
                >
                  <${We} onClick=${V}>
                    Company account
                  </${We}>
                  ${se?null:Ns`
                        <${We} onClick=${J}>
                          Personal account
                        </${We}>
                      `}
                </${pt}>
              </div>
            `:null}
      </div>
      ${o?Ns`<div class="text-fg-muted text-sm text-center py-2">
            Loading...
          </div>`:s.length?Ns`
              <div class="space-y-2 mt-3">
                ${s.map(Q=>Ns`<${Pw}
                      key=${Q.id}
                      account=${Q}
                      personal=${$c(Q)}
                      expanded=${a===Q.id}
                      onToggleExpanded=${pe=>l(te=>te===pe?"":pe)}
                      scopes=${c[Q.id]||Q.activeScopes||wr()}
                      savedScopes=${u[Q.id]||Q.activeScopes||wr()}
                      apiStatus=${f[Q.id]||{}}
                      checkingApis=${a===Q.id&&!!m[Q.id]}
                      onToggleScope=${le}
                      onCheckApis=${ie}
                      onUpdatePermissions=${pe=>de(pe)}
                      onEditCredentials=${oe}
                      onDisconnect=${pe=>A(pe)}
                      gmailWatchStatus=${E.get(Q.id)||null}
                      gmailWatchBusy=${!!R[Q.id]}
                      onEnableGmailWatch=${Ve}
                      onDisableGmailWatch=${et}
                      onOpenGmailSetup=${ce}
                      onOpenGmailWebhook=${n}
                    />`)}
              </div>
            `:Ot()}
    </div>

    <${Mw}
      visible=${v.visible}
      onClose=${he}
      onSaved=${ue}
      title=${v.title}
      submitLabel=${v.submitLabel}
      defaultInstrType=${v.defaultInstrType}
      client=${v.client}
      personal=${v.personal}
      accountId=${v.accountId}
      initialValues=${v.initialValues}
    />

    <${Rw}
      visible=${$}
      onClose=${()=>S(!1)}
      onSubmit=${me}
      loading=${C}
      title="Add Company Account"
    />

    <${Dw}
      visible=${O.visible}
      account=${j(O.accountId)}
      clientConfig=${M.get(String(j(O.accountId)?.client||"default").trim()||"default")||null}
      saving=${B||z}
      onClose=${be}
      onSaveSetup=${U}
      onFinish=${kt}
    />

    <${st}
      visible=${!!k}
      title="Disconnect Google account?"
      message="Your agent will lose access to Gmail, Calendar, and other Google Workspace services until you reconnect."
      confirmLabel="Disconnect"
      cancelLabel="Cancel"
      onCancel=${()=>A("")}
      onConfirm=${async()=>{let Q=k;A(""),await ne(Q)}}
    />
  `};var wc=P.bind(T),N3=(t,e)=>t.find(n=>n.key===e)?.value||"",O3=(t,e)=>{for(let n of t.providers)if((Mn[n]||[]).some(r=>!!N3(e,r.key)))return{active:!0,provider:n};return{active:!1,provider:null}},Ow=({onSwitchTab:t})=>{let{data:e,loading:n}=ct("/api/env",Vr,{maxAgeMs:3e4}),s=Array.isArray(e?.vars)?e.vars:[];return n?null:wc`
    <div class="bg-surface border border-border rounded-xl p-4">
      <h2 class="card-label mb-3">Features</h2>
      <div class="space-y-2">
        ${gg.map(r=>{let i=O3(r,s);return wc`
            <div class="flex justify-between items-center py-1.5">
              <span class="text-sm text-body">${r.label}</span>
              ${i.active?wc`
                    <span class="flex items-center gap-2">
                      <span class="text-xs text-fg-muted">
                        ${zs[i.provider]||i.provider}
                      </span>
                      <${ae} tone="success">Enabled</${ae}>
                    </span>
                  `:wc`
                    <span class="flex items-center gap-2">
                      <a
                        href="#"
                        onclick=${a=>{a.preventDefault(),t?.("envars")}}
                        class="text-xs px-2 py-1 rounded-lg ac-btn-ghost"
                      >Add provider</a>
                      <${ae} tone=${r.hasDefault?"neutral":"danger"}>Disabled</${ae}>
                    </span>
                  `}
            </div>
          `})}
      </div>
    </div>
  `};var B3=P.bind(T),Bw=({doctorStatus:t=null,dismissedUntilMs:e=0,onOpenDoctor:n=()=>{},onDismiss:s=()=>{}})=>fc(t,e)?B3`
    <div class="bg-yellow-500/10 border border-yellow-500/35 rounded-xl p-4">
      <div class="flex flex-col gap-3">
        <div class="space-y-1">
          <h2 class="font-semibold text-sm text-status-warning">Drift Doctor</h2>
          <p class="text-xs text-status-warning/80">${rw(t)}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <${Z}
            onClick=${s}
            tone="secondary"
            idleLabel="Dismiss for 1 week"
          />
          <${Z}
            onClick=${n}
            tone="warning"
            idleLabel="Open Drift Doctor"
          />
        </div>
      </div>
    </div>
  `:null;var kc="0 * * * *",Fw=({statusData:t=null,watchdogData:e=null,doctorStatusData:n=null,onRefreshStatuses:s=()=>{},isActive:o=!1,restartSignal:r=0}={})=>{let[i,a]=y(!1),[l,c]=y(!1),[d,u]=y(!0),[p,f]=y(kc),[g,m]=y(!1),[h,b]=y(kc),[x,v]=y(!1),[w,$]=y(!1),[S,C]=y(!1),_=ee(null),k=t,A=e,O=n,D=k?.gateway??null,z=k?.channels??null,E=k?.repo||null,M=k?.syncCron||null,R=k?.openclawVersion||null,B=bs.some(ue=>{let me=z?.[ue];if(!me)return!1;let V=me.accounts&&typeof me.accounts=="object"?me.accounts:{};return Object.keys(V).length>0?Object.values(V).some(J=>J&&J.status!=="paired"):me.status!=="paired"}),I=Re(async()=>(await Co()).pending||[],3e3,{enabled:B&&D==="running",cacheKey:"/api/pairings"}),U=I.data||[],W=D==="running"&&(w||!S),G=Re(async()=>{let ue=await ga();return C(ue?.cliAutoApproveComplete===!0),ue.pending||[]},5e3,{enabled:W,cacheKey:"/api/devices"}),se=G.data||[];L(()=>{o&&(I.refresh(),W&&G.refresh())},[G.refresh,o,s,I.refresh,w,W]),L(()=>{if(!r||!o)return;s(),I.refresh(),W&&G.refresh();let ue=setTimeout(()=>{s(),I.refresh(),W&&G.refresh()},1200),me=setTimeout(()=>{s(),I.refresh(),W&&G.refresh()},3500);return()=>{clearTimeout(ue),clearTimeout(me)}},[G.refresh,o,s,I.refresh,r,w,W]),L(()=>{M&&(u(M.enabled!==!1),f(M.schedule||kc),b(M.enabled===!1?"disabled":M.schedule||kc))},[M?.enabled,M?.schedule]),L(()=>()=>{_.current&&clearTimeout(_.current)},[]);let K=()=>{v(!0),_.current&&clearTimeout(_.current),_.current=setTimeout(()=>{v(!1),_.current=null},2800),s(),I.refresh(),setTimeout(()=>{s(),I.refresh()},700),setTimeout(()=>{s(),I.refresh()},1800)},j=async({enabled:ue=d,schedule:me=p}={})=>{if(!g){m(!0);try{let V=await ym({enabled:ue,schedule:me});if(!V.ok)throw new Error(V.error||"Could not save sync settings");N("Sync schedule updated","success"),s()}catch(V){N(V.message||"Could not save sync settings","error")}finally{m(!1)}}};return{state:{channels:z,dashboardLoading:i,devicePending:se,doctorStatus:O,gatewayStatus:D,hasUnpaired:B,openclawVersion:R,pending:U,pairingStatusRefreshing:x,repairingWatchdog:l,repo:E,savingSyncCron:g,syncCron:M,syncCronChoice:h,syncCronEnabled:d,syncCronSchedule:p,syncCronStatusText:d?"Enabled":"Disabled",watchdogStatus:A},actions:{handleApprove:async(ue,me,V="")=>{await _o(ue,me,V),K()},handleDeviceApprove:async ue=>{await ba(ue),setTimeout(G.refresh,500),setTimeout(G.refresh,2e3)},handleDeviceReject:async ue=>{await xa(ue),setTimeout(G.refresh,500),setTimeout(G.refresh,2e3)},handleOpenDashboard:async()=>{if(!i){$(!0),a(!0);try{let ue=await hm();console.log("[dashboard] response:",JSON.stringify(ue)),window.open(ue.url||"/openclaw","_blank")}catch(ue){console.error("[dashboard] error:",ue),window.open("/openclaw","_blank")}finally{a(!1)}}},handleReject:async(ue,me,V="")=>{try{await Mo(ue,me,V),K()}catch(J){N(J.message||"Could not reject pairing","error")}},handleSyncCronChoiceChange:async ue=>{b(ue);let me=ue!=="disabled",V=me?ue:p;u(me),f(V),await j({enabled:me,schedule:V})},handleWatchdogRepair:async()=>{if(!l){c(!0);try{let ue=await ha();if(!ue.ok)throw new Error(ue.error||"Repair failed");N("Repair triggered","success"),setTimeout(()=>{s()},800)}catch(ue){N(ue.message||"Could not run repair","error")}finally{c(!1)}}}}}};var Sc=P.bind(T),Hw=({statusData:t=null,watchdogData:e=null,doctorStatusData:n=null,agents:s=[],doctorWarningDismissedUntilMs:o=0,onRefreshStatuses:r=()=>{},onSwitchTab:i=()=>{},onNavigate:a=()=>{},onOpenGmailWebhook:l=()=>{},isActive:c=!1,restartingGateway:d=!1,onRestartGateway:u=()=>{},restartSignal:p=0,openclawUpdateInProgress:f=!1,onOpenclawVersionActionComplete:g=()=>{},onOpenclawUpdate:m=()=>{},onRestartRequired:h=()=>{},onDismissDoctorWarning:b=()=>{}})=>{let{state:x,actions:v}=Fw({statusData:t,watchdogData:e,doctorStatusData:n,onRefreshStatuses:r,isActive:c,restartSignal:p});return Sc`
    <div class="space-y-4">
      <${bc}
        status=${x.gatewayStatus}
        openclawVersion=${x.openclawVersion}
        restarting=${d}
        onRestart=${u}
        watchdogStatus=${x.watchdogStatus}
        onOpenWatchdog=${()=>i("watchdog")}
        onRepair=${v.handleWatchdogRepair}
        repairing=${x.repairingWatchdog}
        openclawUpdateInProgress=${f}
        onOpenclawVersionActionComplete=${g}
        onOpenclawUpdate=${m}
      />
      <${Bw}
        doctorStatus=${x.doctorStatus}
        dismissedUntilMs=${o}
        onOpenDoctor=${()=>i("doctor")}
        onDismiss=${b}
      />
      <${nl}
        channelsSection=${Sc`
          <${Cb}
            channels=${x.channels}
            agents=${s}
            onNavigate=${a}
            onRefreshStatuses=${r}
          />
        `}
        pairingsSection=${Sc`
          <${tl}
            pending=${x.pending}
            channels=${x.channels}
            visible=${x.hasUnpaired}
            statusRefreshing=${x.pairingStatusRefreshing}
            onApprove=${v.handleApprove}
            onReject=${v.handleReject}
          />
        `}
      />
      <${Ow} onSwitchTab=${i} />
      <${Nw}
        gatewayStatus=${x.gatewayStatus}
        onRestartRequired=${h}
        onOpenGmailWebhook=${l}
      />

      ${x.repo&&Sc`
        <div class="bg-surface border border-border rounded-xl p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 min-w-0">
              <svg
                class="w-4 h-4 text-fg-muted"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                />
              </svg>
              <a
                href="https://github.com/${x.repo}"
                target="_blank"
                class="text-sm text-fg-muted hover:text-body transition-colors truncate"
                >${x.repo}</a
              >
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs text-fg-muted">Auto-sync</span>
              <div class="relative">
                <select
                  value=${x.syncCronChoice}
                  onchange=${w=>v.handleSyncCronChoiceChange(w.target.value)}
                  disabled=${x.savingSyncCron}
                  class="appearance-none bg-field border border-border rounded-lg pl-2.5 pr-9 py-1.5 text-xs text-body ${x.savingSyncCron?"opacity-50 cursor-not-allowed":""}"
                  title=${x.syncCron?.installed===!1?"Not Installed Yet":x.syncCronStatusText}
                >
                  <option value="disabled">Disabled</option>
                  <option value="*/30 * * * *">Every 30 min</option>
                  <option value="0 * * * *">Hourly</option>
                  <option value="0 0 * * *">Daily</option>
                </select>
                <${Ca}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-muted"
                />
              </div>
            </div>
          </div>
        </div>
      `}

      <div class="bg-surface border border-border rounded-xl p-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-sm">OpenClaw Gateway Dashboard</h2>
          </div>
          <${tn}
            onClick=${v.handleOpenDashboard}
            loading=${x.dashboardLoading}
            warning=${!1}
            idleLabel="Open"
            loadingLabel="Opening..."
          />
        </div>
        <${xc}
          pending=${x.devicePending}
          onApprove=${v.handleDeviceApprove}
          onReject=${v.handleDeviceReject}
        />
      </div>
    </div>
  `};var F3=P.bind(T),ff=({statusData:t=null,watchdogData:e=null,doctorStatusData:n=null,agents:s=[],doctorWarningDismissedUntilMs:o=0,onRefreshStatuses:r=()=>{},onSetLocation:i=()=>{},onNavigate:a=()=>{},restartingGateway:l=!1,onRestartGateway:c=()=>{},restartSignal:d=0,openclawUpdateInProgress:u=!1,onOpenclawVersionActionComplete:p=()=>{},onOpenclawUpdate:f=()=>{},onRestartRequired:g=()=>{},onDismissDoctorWarning:m=()=>{}})=>F3`
  <div class="pt-4">
    <${Hw}
      statusData=${t}
      watchdogData=${e}
      doctorStatusData=${n}
      agents=${s}
      doctorWarningDismissedUntilMs=${o}
      onRefreshStatuses=${r}
      onSwitchTab=${h=>i(`/${h}`)}
      onNavigate=${a}
      onOpenGmailWebhook=${()=>i("/webhooks/gmail")}
      isActive=${!0}
      restartingGateway=${l}
      onRestartGateway=${c}
      restartSignal=${d}
      openclawUpdateInProgress=${u}
      onOpenclawVersionActionComplete=${p}
      onOpenclawUpdate=${f}
      onRestartRequired=${g}
      onDismissDoctorWarning=${m}
    />
  </div>
`;var Nt=P.bind(T),H3={anthropic:{label:"Anthropic",modes:[{id:"api_key",label:"API Key",profileSuffix:"default",placeholder:"sk-ant-api03-...",url:"https://console.anthropic.com",field:"key"},{id:"token",label:"Setup Token",profileSuffix:"manual",placeholder:"sk-ant-oat01-...",hint:"From claude setup-token (uses your Claude subscription)",field:"token"}]},openai:{label:"OpenAI",modes:[{id:"api_key",label:"API Key",profileSuffix:"default",placeholder:"sk-...",url:"https://platform.openai.com",field:"key"}]},"openai-codex":{label:"OpenAI Codex",modes:[{id:"oauth",label:"Codex OAuth",isCodexOauth:!0}]},google:{label:"Gemini",modes:[{id:"api_key",label:"API Key",profileSuffix:"default",placeholder:"AI...",url:"https://aistudio.google.com",field:"key"}]}},W3={id:"api_key",label:"API Key",profileSuffix:"default",placeholder:"...",field:"key"},V3=t=>{let e=Mn[t]||[];return e.length===0?[W3]:e.map(n=>({id:"api_key",label:n.label||"API Key",profileSuffix:"default",placeholder:n.placeholder||"...",hint:n.hint,url:n.url,field:"key"}))},j3=t=>H3[t]||{label:zs[t]||t,modes:V3(t)},zi=(t,e)=>`${t.provider||e}:${t.profileSuffix||"default"}`,Cc=t=>String(t?.key||t?.token||t?.access||"").trim(),z3=({codexStatus:t,onRefreshCodex:e})=>{let[n,s]=y(!1),[o,r]=y(!1),[i,a]=y(""),[l,c]=y(!1),d=ee(null);L(()=>()=>{d.current&&clearInterval(d.current)},[]),L(()=>{let g=async m=>{m.data?.codex==="success"?(N("Codex connected","success"),s(!1),r(!1),await e()):m.data?.codex==="error"&&N(`Codex auth failed: ${m.data.message||"unknown error"}`,"error")};return window.addEventListener("message",g),()=>window.removeEventListener("message",g)},[e]);let u=()=>{s(!0),r(!0);let g=window.open("/auth/codex/start","codex-auth","popup=yes,width=640,height=780");if(!g||g.closed){r(!1),window.location.href="/auth/codex/start";return}d.current&&clearInterval(d.current),d.current=setInterval(()=>{g.closed&&(clearInterval(d.current),d.current=null,r(!1))},500)},p=async()=>{if(!(!i.trim()||l)){c(!0);try{let g=await Wr(i.trim());if(!g.ok)throw new Error(g.error||"Codex OAuth exchange failed");a(""),N("Codex connected","success"),s(!1),r(!1),await e()}catch(g){N(g.message||"Codex OAuth exchange failed","error")}finally{c(!1)}}},f=async()=>{let g=await Hr();if(!g.ok){N(g.error||"Failed to disconnect Codex","error");return}N("Codex disconnected","success"),s(!1),r(!1),a(""),await e()};return Nt`
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs text-fg-muted">Codex OAuth</span>
        ${t.connected?Nt`<${ae} tone="success">Connected</${ae}>`:Nt`<${ae} tone="warning">Not connected</${ae}>`}
      </div>
      ${t.connected?Nt`
            <div class="flex gap-2">
              <button
                onclick=${u}
                class="text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-secondary"
              >
                Reconnect
              </button>
              <button
                onclick=${f}
                class="text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-ghost"
              >
                Disconnect
              </button>
            </div>
          `:n?Nt`
              <div class="flex items-center justify-between gap-2">
                <p class="text-xs text-fg-muted">
                  ${o?"Complete login in the popup, then paste the redirect URL.":"Paste the redirect URL from your browser to finish connecting."}
                </p>
                <button
                  onclick=${u}
                  class="text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-secondary shrink-0"
                >
                  Restart
                </button>
              </div>
            `:Nt`
              <button
                onclick=${u}
                class="text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-cyan"
              >
                Connect Codex OAuth
              </button>
            `}
      ${!t.connected&&n?Nt`
            <p class="text-xs text-fg-muted">
              After login, copy the full redirect URL (starts with
              <code class="text-xs bg-field px-1 rounded"
                >http://localhost:1455/auth/callback</code
              >) and paste it here.
            </p>
            <input
              type="text"
              value=${i}
              onInput=${g=>a(g.target.value)}
              placeholder="http://localhost:1455/auth/callback?code=...&state=..."
              class="w-full bg-field border border-border rounded-lg px-3 py-2 text-xs text-body outline-none focus:border-fg-muted"
            />
            <${Z}
              onClick=${p}
              disabled=${!i.trim()||l}
              loading=${l}
              tone="primary"
              size="sm"
              idleLabel="Complete Codex OAuth"
              loadingLabel="Completing..."
              className="text-xs font-medium px-3 py-1.5"
            />
          `:null}
    </div>
  `},Ww=({provider:t,authProfiles:e,authOrder:n,codexStatus:s,onEditProfile:o,onEditAuthOrder:r,getProfileValue:i,getEffectiveOrder:a,onRefreshCodex:l})=>{let c=j3(t),d=c.modes.filter($=>!$.isCodexOauth),u=d.length>1,p=c.modes.some($=>$.isCodexOauth),f=a(t),g=f?.[0]||null,m=n[t]||null,h=d.some($=>{let S=zi($,t),C=e.find(k=>k.id===S)||null,_=i(S);return Cc(_)!==Cc(C)}),b=JSON.stringify(f||null)!==JSON.stringify(m),x=h||b,v=d.some($=>{let S=zi($,t),C=i(S);return!!(C?.key||C?.token||C?.access)})||t==="openai-codex"&&!!s?.connected,w=$=>{let S=zi($,t),C=d.map(k=>zi(k,t)),_=[S,...C.filter(k=>k!==S)];r(t,_)};return Nt`
    <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="card-label">${c.label}</h3>
        ${p&&d.length===0?null:x?Nt`<${ae} tone="warning">Unsaved</${ae}>`:v?Nt`<${ae} tone="success">Connected</${ae}>`:Nt`<${ae} tone="warning">Not configured</${ae}>`}
      </div>
      ${d.map($=>{let S=zi($,t),C=$.provider||t,_=i(S),k=_?.[$.field]||"",A=!u||g===S||!g&&$===d[0];return Nt`
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <label class="text-xs font-medium text-fg-muted"
                >${$.label}</label
              >
              ${u&&A?Nt`<${ae} tone="cyan">Primary</${ae}>`:null}
              ${u&&!A&&k?Nt`<button
                    onclick=${()=>w($)}
                    class="text-xs px-1.5 py-0.5 rounded-full text-fg-muted hover:text-body hover:bg-surface"
                  >
                    Set primary
                  </button>`:null}
              ${$.url&&!k?Nt`<a
                    href=${$.url}
                    target="_blank"
                    class="text-xs hover:underline"
                    style="color: var(--accent-link)"
                    >Get</a
                  >`:null}
            </div>
            <${Rt}
              value=${k}
              onInput=${O=>{let D=O.target.value,z={type:$.id,provider:C,[$.field]:D};_?.expires&&(z.expires=_.expires),o(S,z);let E=e.find(R=>R.id===S)||null;Cc(z)===Cc(E)&&u?r(t,m):u&&D&&!A&&w($)}}
              placeholder=${$.placeholder||""}
              isSecret=${!0}
              inputClass="flex-1 w-full bg-field border border-border rounded-lg px-3 py-2 text-sm text-body outline-none focus:border-fg-muted font-mono"
            />
            ${$.hint?Nt`<p class="text-xs text-fg-dim">${$.hint}</p>`:null}
          </div>
        `})}
      ${c.modes.some($=>$.isCodexOauth)?Nt`
            <div class="border border-border rounded-lg p-3">
              <${z3}
                codexStatus=${s}
                onRefreshCodex=${l}
              />
            </div>
          `:null}
    </div>
  `};var Mt=P.bind(T),U3=t=>{let e=new Set;for(let n of Object.keys(t)){let s=ri(n);s&&e.add(s)}return[...e]},K3=["anthropic","openai","openai-codex",...jr.filter(t=>!["anthropic","openai"].includes(t))],Vw=({onRestartRequired:t=()=>{},agentId:e,embedded:n=!1})=>{let{catalog:s,primary:o,configuredModels:r,authProfiles:i,authOrder:a,codexStatus:l,loading:c,saving:d,ready:u,error:p,isDirty:f,addModel:g,removeModel:m,setPrimaryModel:h,editProfile:b,editAuthOrder:x,getProfileValue:v,getEffectiveOrder:w,cancelChanges:$,saveAll:S,refreshCodexStatus:C}=rl(e),_=F(()=>new Set(Object.keys(r)),[r]),k=F(()=>Lo(s),[s]),A=F(()=>k.filter(I=>!_.has(I.key)),[k,_]),O=F(()=>[...s].filter(I=>!_.has(I.key)).sort((I,U)=>{let W=jo(vs(I))-jo(vs(U));return W!==0?W:String(I.label||I.key).localeCompare(String(U.label||U.key))}),[s,_]),D=F(()=>U3(r),[r]),z=F(()=>{let I=[];for(let U of K3)D.includes(U)&&I.push(U);for(let U of D)I.includes(U)||I.push(U);return I},[D]),E=F(()=>sl({authProfiles:i,codexStatus:l}),[i,l]),M=F(()=>Object.keys(r).map(I=>{let U=s.find(se=>se.key===I),W=ri(I),G=!!E[W];return{key:I,label:U?.label||I,isPrimary:I===o,hasAuth:G}}),[r,s,o,E]),R=Mt`
    <${Qn} visible=${f}>
      <${Z}
        onClick=${$}
        disabled=${d}
        tone="secondary"
        size="sm"
        idleLabel="Cancel"
        className="text-xs"
      />
      <${Z}
        onClick=${S}
        disabled=${d}
        loading=${d}
        loadingMode="inline"
        tone="primary"
        size="sm"
        idleLabel="Save changes"
        loadingLabel="Saving…"
        className="text-xs"
      />
    </${Qn}>
  `;if(!u){let I=Mt`
      <div class="bg-surface border border-border rounded-xl p-4">
        <div class="flex items-center gap-2 text-sm text-fg-muted">
          <${Ce} className="h-4 w-4" />
          Loading model settings...
        </div>
      </div>
    `;return n?I:Mt`
      <${zn}
        header=${Mt`<${Ne} title="Models" />`}
      >
        ${I}
      </${zn}>
    `}let B=Mt`
    <!-- Configured Models -->
    <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <h2 class="card-label">Available Models</h2>

      ${M.length===0?Mt`<p class="text-xs text-fg-muted">
            No models configured. Add a model below.
          </p>`:Mt`
            <div class="space-y-1">
              ${M.map(I=>Mt`
                  <div
                    class="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="text-sm text-body truncate"
                        >${I.label}</span
                      >
                      ${I.isPrimary?Mt`<${ae} tone="cyan">Primary</${ae}>`:I.hasAuth?Mt`
                              <button
                                onclick=${()=>h(I.key)}
                                class="text-xs px-2 py-0.5 rounded-full text-fg-muted hover:text-body hover:bg-surface"
                              >
                                Set primary
                              </button>
                            `:Mt`<${ae} tone="warning">Needs auth</${ae}>`}
                    </div>
                    <button
                      onclick=${()=>m(I.key)}
                      class="text-xs text-fg-dim hover:text-status-error-muted shrink-0 px-1"
                    >
                      Remove
                    </button>
                  </div>
                `)}
            </div>
          `}

      <div class="space-y-2">
        <${ol}
          options=${O}
          popularModels=${A}
          placeholder="Add model..."
          onSelect=${I=>{g(I),o||h(I)}}
        />
      </div>

      ${c?Mt`<p class="text-xs text-fg-dim">
            Loading model catalog...
          </p>`:p?Mt`<p class="text-xs text-fg-dim">${p}</p>`:null}
    </div>

    <!-- Provider Auth -->
    ${z.length>0?Mt`
          <div class="space-y-3">
            <h2 class="font-semibold text-base">
              Provider Authentication
            </h2>
            ${z.map(I=>Mt`
                <${Ww}
                  provider=${I}
                  authProfiles=${i}
                  authOrder=${a}
                  codexStatus=${l}
                  onEditProfile=${b}
                  onEditAuthOrder=${x}
                  getProfileValue=${v}
                  getEffectiveOrder=${w}
                  onRefreshCodex=${C}
                />
              `)}
          </div>
        `:null}
  `;return n?Mt`
      <div class="space-y-4">
        <div class="flex items-center justify-end gap-2">
          ${R}
        </div>
        ${B}
      </div>
    `:Mt`
    <${zn}
      header=${Mt`<${Ne} title="Models" actions=${R} />`}
    >
      ${B}
    </${zn}>
  `};var G3=P.bind(T),hf=({onRestartRequired:t=()=>{}})=>G3`
  <${Vw} onRestartRequired=${t} />
`;var q3=1e4,jw=({enabled:t=!0}={})=>{let e=Re(async()=>{let n=await Pm(),s=Array.isArray(n?.nodes)?n.nodes:[],o=Array.isArray(n?.pending)?n.pending:[];return{nodes:s,pending:o}},q3,{enabled:t,cacheKey:"/api/nodes"});return{nodes:Array.isArray(e.data?.nodes)?e.data.nodes:[],pending:Array.isArray(e.data?.pending)?e.data.pending:[],loading:e.data===null&&!e.error,error:e.error?String(e.error.message||"Could not load nodes"):"",refresh:e.refresh}};var zw=()=>{let t=jw({enabled:!0}),[e,n]=y(!1),[s,o]=y(!1),{data:r,error:i}=ct("/api/nodes/connect-info",ya,{maxAgeMs:6e4}),a=Array.isArray(t.nodes)?t.nodes.filter(c=>c?.paired!==!1):[];L(()=>{i&&N(i.message||"Could not load node connect command","error")},[i]);let l=q(async()=>{if(!s){o(!0);try{await t.refresh()}finally{o(!1)}}},[t.refresh,s]);return{state:{wizardVisible:e,nodes:a,pending:t.pending,loadingNodes:t.loading,refreshingNodes:s,nodesError:t.error,connectInfo:r},actions:{openWizard:()=>n(!0),closeWizard:()=>n(!1),refreshNodes:l}}};var J3=35e3,Z3=1e4,Kw="nodesBrowserAttachStateByNode",Y3=/selected page has been closed/i,X3=async(t,e=J3)=>{let n=null;try{return await Promise.race([t,new Promise((s,o)=>{n=setTimeout(()=>{o(new Error("Browser check timed out"))},e)})])}finally{n&&clearTimeout(n)}},Uw=t=>{let e=Array.isArray(t?.caps)?t.caps:[],n=Array.isArray(t?.commands)?t.commands:[];return e.includes("browser")||n.includes("browser.proxy")},Q3=t=>{let e=String(t?.message||"Could not check node browser status").trim();return Y3.test(e)?"Selected Chrome page was closed. Click Attach to reconnect.":e},eR=()=>{let e=Fe()?.[Kw];return!e||typeof e!="object"||Array.isArray(e)?{}:e},tR=(t={})=>{vx(e=>({...e&&typeof e=="object"?e:{},[Kw]:t&&typeof t=="object"?t:{}}))},Gw=({nodes:t=[],onRefreshNodes:e=async()=>{}}={})=>{let[n,s]=y({}),[o,r]=y({}),[i,a]=y(""),[l,c]=y(()=>eR()),[d,u]=y(""),[p,f]=y(null),[g,m]=y(""),h=ee(0),b=ee(""),x=async(k,{successMessage:A="Connection command copied",errorMessage:O="Could not copy connection command"}={})=>{if(await Ho(k)){N(A,"success");return}N(O,"error")},v=q(async(k,{silent:A=!1}={})=>{let O=String(k||"").trim();if(!(!O||b.current)){b.current=O,A||a(O),r(D=>({...D,[O]:""}));try{let D=await X3(Em(O,"user")),z=D?.status&&typeof D.status=="object"?D.status:null;s(E=>({...E,[O]:z}))}catch(D){let z=Q3(D);s(E=>({...E,[O]:null})),r(E=>({...E,[O]:z})),A||N(z,"error")}finally{b.current="",A||a("")}}},[]),w=q((k,A)=>{let O=String(k||"").trim();O&&c(D=>{let z={...D&&typeof D=="object"?D:{},[O]:A===!0};return tR(z),z})},[]),$=q(async k=>{let A=String(k||"").trim();A&&(w(A,!0),await v(A))},[v,w]),S=q(k=>{let A=String(k||"").trim();A&&(w(A,!1),s(O=>{let D={...O||{}};return delete D[A],D}),r(O=>{let D={...O||{}};return delete D[A],D}))},[w]),C=q(k=>{let A=String(k||"").trim();A&&u(O=>O===A?"":A)},[]),_=q(async()=>{let k=String(p?.nodeId||"").trim();if(!(!k||g)){m(k);try{await Rm(k),S(k),N("Device removed","success"),f(null),u(""),await e()}catch(A){N(A.message||"Could not remove node","error")}finally{m("")}}},[S,e,p,g]);return L(()=>{if(i)return;let k=t.map(A=>({nodeId:String(A?.nodeId||"").trim(),connected:A?.connected===!0,browserCapable:Uw(A)})).find(A=>!(!A.nodeId||!A.connected||!A.browserCapable||l?.[A.nodeId]!==!0||n?.[A.nodeId]||o?.[A.nodeId]))?.nodeId;k&&v(k,{silent:!0})},[l,o,n,i,v,t]),L(()=>{if(i)return;let k=t.map(z=>({nodeId:String(z?.nodeId||"").trim(),connected:z?.connected===!0,browserCapable:Uw(z),browserRunning:n?.[String(z?.nodeId||"").trim()]?.running===!0})).filter(z=>z.nodeId&&z.connected&&z.browserCapable&&l?.[z.nodeId]===!0&&z.browserRunning).map(z=>z.nodeId);if(!k.length)return;let A=!0,D=setInterval(async()=>{if(!A||b.current)return;let z=h.current%k.length;h.current+=1;let E=k[z];await v(E,{silent:!0})},Z3);return()=>{A=!1,clearInterval(D)}},[l,n,i,v,t]),{browserStatusByNodeId:n,browserErrorByNodeId:o,checkingBrowserNodeId:i,browserAttachStateByNodeId:l,menuOpenNodeId:d,removeDialogNode:p,removingNodeId:g,handleCopyText:x,handleCheckNodeBrowser:v,handleAttachNodeBrowser:$,handleDetachNodeBrowser:S,handleOpenNodeMenu:C,handleRemoveNode:_,setMenuOpenNodeId:u,setRemoveDialogNode:f}};var ot=P.bind(T),nR=t=>String(t||"").replace(/"/g,'\\"'),qw=({node:t,connectInfo:e,maskToken:n=!1})=>{let s=String(e?.gatewayHost||"").trim()||"localhost",o=Number(e?.gatewayPort)||3e3,r=String(e?.gatewayToken||"").trim(),i=e?.tls===!0?"--tls":"",a=String(t?.displayName||t?.nodeId||"My Node").trim(),l=n?"****":r;return[l?`OPENCLAW_GATEWAY_TOKEN=${l}`:"","openclaw node run",`--host ${s}`,`--port ${o}`,i,`--display-name "${nR(a)}"`].filter(Boolean).join(" ")},sR=t=>t?.connected?ot`<${ae} tone="success">Connected</${ae}>`:t?.paired?ot`<${ae} tone="warning">Disconnected</${ae}>`:ot`<${ae} tone="danger">Pending approval</${ae}>`,oR=t=>{let e=Array.isArray(t?.caps)?t.caps:[],n=Array.isArray(t?.commands)?t.commands:[];return e.includes("browser")||n.includes("browser.proxy")},rR=t=>t.running?"success":"warning",iR=t=>t.running?"Attached":"Not connected",Jw=({nodes:t=[],pending:e=[],loading:n=!1,error:s="",connectInfo:o=null,onRefreshNodes:r=async()=>{}})=>{let i=Gw({nodes:t,onRefreshNodes:r}),{browserStatusByNodeId:a,browserErrorByNodeId:l,checkingBrowserNodeId:c,browserAttachStateByNodeId:d,menuOpenNodeId:u,removeDialogNode:p,removingNodeId:f,handleCopyText:g,handleCheckNodeBrowser:m,handleAttachNodeBrowser:h,handleDetachNodeBrowser:b,handleOpenNodeMenu:x,handleRemoveNode:v,setMenuOpenNodeId:w,setRemoveDialogNode:$}=i;return ot`
    <div class="space-y-3">
      ${e.length?ot`
            <div
              class="bg-surface border border-yellow-500/40 rounded-xl px-4 py-3 text-xs text-status-warning"
            >
              ${e.length} pending node${e.length===1?"":"s"}
              waiting for approval.
            </div>
          `:null}
      ${n?ot`
            <div class="bg-surface border border-border rounded-xl p-4">
              <div class="flex items-center gap-3 text-sm text-fg-muted">
                <${Ce} className="h-4 w-4" />
                <span>Loading nodes...</span>
              </div>
            </div>
          `:s?ot`
              <div
                class="bg-surface border border-border rounded-xl p-4 text-xs text-status-error-muted"
              >
                ${s}
              </div>
            `:t.length?ot`
                <div class="space-y-2">
                  ${t.map(S=>{let C=String(S?.nodeId||"").trim(),_=a[C]||null,k=l[C]||"",A=c===C,O=S?.connected&&oR(S)&&C,D=d?.[C]===!0,z=!!_||!!k,E=_?.running===!0,M=D&&!z&&!A,R=O&&D&&!A&&z&&!E;return ot`
                      <div
                        class="bg-surface border border-border rounded-xl p-4 space-y-2"
                      >
                        <div class="flex items-center justify-between gap-2">
                          <div class="min-w-0 space-y-1">
                            <div class="flex items-center gap-2 min-w-0 mb-2">
                              <div class="text-sm font-medium truncate">
                                ${S?.displayName||S?.nodeId||"Unnamed node"}
                              </div>
                              ${C?ot`
                                    <button
                                      type="button"
                                      class="shrink-0 inline-flex items-center gap-1 text-[11px] text-fg-muted hover:text-body"
                                      onclick=${()=>g(C,{successMessage:"Device ID copied",errorMessage:"Could not copy device ID"})}
                                    >
                                      <${Us}
                                        className="w-3.5 h-3.5"
                                      />
                                      <span>Copy device id</span>
                                    </button>
                                  `:null}
                            </div>
                          </div>
                          <div class="flex items-center gap-1.5">
                            ${sR(S)}
                            ${S?.paired?ot`
                                <${pt}
                                  open=${u===C}
                                  ariaLabel="Open node actions"
                                  title="Open node actions"
                                  onClose=${()=>w("")}
                                  onToggle=${()=>x(C)}
                                >
                                  <${We}
                                    className="text-status-error hover:text-status-error"
                                    onClick=${()=>{w(""),$(S)}}
                                  >
                                    Remove device
                                  </${We}>
                                </${pt}>
                              `:null}
                          </div>
                        </div>
                        <div class="flex flex-wrap gap-2 text-[11px]">
                          <div class="ac-surface-inset rounded-lg px-2.5 py-1">
                            <span class="text-fg-muted">platform: </span>
                            <code>${S?.platform||"unknown"}</code>
                          </div>
                          <div class="ac-surface-inset rounded-lg px-2.5 py-1">
                            <span class="text-fg-muted">version: </span>
                            <code>${S?.version||"unknown"}</code>
                          </div>
                          <div class="ac-surface-inset rounded-lg px-2.5 py-1">
                            <span class="text-fg-muted">capabilities: </span>
                            <code
                              >${Array.isArray(S?.caps)?S.caps.join(", "):"none"}</code
                            >
                          </div>
                        </div>
                        ${O?ot`
                              <div class="space-y-2">
                                <div
                                  class="ac-surface-inset rounded-lg px-3 py-2 space-y-2"
                                >
                                  <div
                                    class="flex items-start justify-between gap-2"
                                  >
                                    <div class="space-y-0.5">
                                      <div class="text-sm font-medium">
                                        Browser
                                      </div>
                                      ${D?ot`
                                            <div
                                              class="text-[11px] text-fg-muted"
                                            >
                                              profile: <code>user</code>
                                            </div>
                                          `:ot`
                                            <div
                                              class="text-[11px] text-fg-muted"
                                            >
                                              Attach is disabled until you click
                                              ${" "}
                                              <code>Attach</code>
                                              ${" "} (prevents control prompts
                                              when opening this tab).
                                            </div>
                                          `}
                                    </div>
                                    <div class="flex items-start gap-2">
                                      ${_?ot`
                                          <span class="inline-flex mt-0.5">
                                            <${ae} tone=${rR(_)}
                                              >${iR(_)}</${ae}
                                            >
                                          </span>
                                        `:null}
                                      ${M?ot`
                                            <${Ce}
                                              className="h-3.5 w-3.5"
                                            />
                                          `:null}
                                      ${A?ot`
                                            <${Ce}
                                              className="h-3.5 w-3.5"
                                            />
                                          `:null}
                                      ${O&&!D?ot`
                                            <${Z}
                                              onClick=${()=>h(C)}
                                              idleLabel="Attach"
                                              tone="primary"
                                              size="sm"
                                            />
                                          `:null}
                                      ${R?ot`
                                            <${Z}
                                              onClick=${()=>m(C)}
                                              idleLabel="Check"
                                              tone="secondary"
                                              size="sm"
                                            />
                                          `:null}
                                      ${O&&D&&!A?ot`
                                            <button
                                              type="button"
                                              onclick=${()=>b(C)}
                                              class="shrink-0 text-[11px] text-fg-muted hover:text-body"
                                            >
                                              Detach
                                            </button>
                                          `:null}
                                    </div>
                                  </div>
                                  ${_?ot`
                                        <div
                                          class="flex items-center justify-between gap-2"
                                        >
                                          <div
                                            class="flex flex-wrap gap-2 text-[11px] text-fg-muted"
                                          >
                                            <span
                                              >driver:
                                              <code
                                                >${_?.driver||"unknown"}</code
                                              ></span
                                            >
                                            <span
                                              >transport:
                                              <code
                                                >${_?.transport||"unknown"}</code
                                              ></span
                                            >
                                          </div>
                                        </div>
                                      `:null}
                                  ${k?ot`<div
                                        class="text-[11px] text-status-error-muted"
                                      >
                                        ${k}
                                      </div>`:null}
                                </div>
                              </div>
                            `:null}
                        ${S?.paired&&!S?.connected&&o?ot`
                              <div
                                class="border-t border-border pt-2 space-y-2"
                              >
                                <div class="text-[11px] text-fg-muted">
                                  Reconnect command
                                </div>
                                <div class="flex items-center gap-2">
                                  <input
                                    type="text"
                                    readonly
                                    value=${qw({node:S,connectInfo:o,maskToken:!0})}
                                    class="flex-1 min-w-0 bg-field border border-border rounded-lg px-2 py-1.5 text-[11px] font-mono text-body"
                                  />
                                  <${Z}
                                    onClick=${()=>g(qw({node:S,connectInfo:o,maskToken:!1}),{successMessage:"Connection command copied",errorMessage:"Could not copy connection command"})}
                                    tone="secondary"
                                    size="sm"
                                    iconOnly=${!0}
                                    idleIcon=${Us}
                                    idleIconClassName="w-3.5 h-3.5"
                                    ariaLabel="Copy reconnect command"
                                    title="Copy reconnect command"
                                  />
                                </div>
                              </div>
                            `:null}
                      </div>
                    `})}
                </div>
              `:ot`
                <div
                  class="bg-surface border border-border rounded-xl px-6 py-10 min-h-[26rem] flex flex-col items-center justify-center text-center"
                >
                  <div class="max-w-md w-full flex flex-col items-center gap-4">
                    <${Pa} className="h-12 w-12 text-cyan-400" />
                    <div class="space-y-2">
                      <h2 class="font-semibold text-lg text-bright">
                        No connected nodes yet
                      </h2>
                      <p class="text-xs text-fg-muted leading-5">
                        Connect a Mac, iOS, Android, or headless node to run
                        system and browser commands through this gateway.
                      </p>
                    </div>
                  </div>
                </div>
              `}
    </div>
    <${st}
      visible=${!!p}
      title="Remove device?"
      message=${p?.connected?"This device is currently connected. Removing it will disconnect and remove the paired device from this gateway (equivalent to running openclaw devices remove for this device id). The device can reconnect and pair again later.":"This removes the paired device from this gateway (equivalent to running openclaw devices remove for this device id). The device can reconnect and pair again later."}
      confirmLabel="Remove device"
      confirmLoadingLabel="Removing..."
      confirmTone="warning"
      confirmLoading=${!!f}
      confirmDisabled=${!!f}
      onCancel=${()=>{f||$(null)}}
      onConfirm=${v}
    />
  `};var aR=P.bind(T),lR="https://github.com/openclaw/openclaw/releases/tag/v2026.3.13",cR=`Release reference: [OpenClaw 2026.3.13](${lR})

## Requirements

- OpenClaw 2026.3.13+
- Chrome 144+
- Node.js installed on the Mac node so \`npx\` is available

## Setup

### 1) Enable remote debugging in Chrome

Open \`chrome://inspect/#remote-debugging\` and turn it on. Do **not** launch Chrome with \`--remote-debugging-port\`.

### 2) Configure the node

In \`~/.openclaw/openclaw.json\` on the Mac node:

\`\`\`json
{
  "browser": {
    "defaultProfile": "user"
  }
}
\`\`\`

The built-in \`user\` profile uses live Chrome attach. You do not need a custom \`existing-session\` profile.

### 3) Approve Chrome consent

On first connect, Chrome prompts for DevTools MCP access. Click **Allow**.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Browser proxy times out (20s) | Restart Chrome cleanly and run the check again. |
| Config validation error on existing-session | Do not define a custom existing-session profile. Use \`defaultProfile: "user"\`. |
| EADDRINUSE on port 9222 | Quit Chrome launched with \`--remote-debugging-port\` and relaunch normally. |
| Consent dialog appears but attach hangs | Quit Chrome, relaunch, and approve the dialog again. |
| \`npx chrome-devtools-mcp\` not found | Install Node.js on the Mac node so \`npx\` exists in PATH. |`,Zw=()=>{let t=F(()=>Le.parse(cR,{gfm:!0,breaks:!0}),[]);return aR`
    <details
      class="ac-surface-inset rounded-lg border border-border px-3 py-2.5"
    >
      <summary class="cursor-pointer text-xs text-body hover:text-body">
        Chrome debugging setup / troubleshooting
      </summary>
      <div
        class="pt-3 px-2 file-viewer-preview release-notes-preview text-xs leading-5"
        dangerouslySetInnerHTML=${{__html:t}}
      ></div>
    </details>
  `};var Yw=3e3,Xw=({visible:t=!1,nodes:e=[],refreshNodes:n=async()=>{},onRestartRequired:s=()=>{},onClose:o=()=>{}}={})=>{let[r,i]=y(0),[a,l]=y(null),[c,d]=y(!1),[u,p]=y("My Mac Node"),[f,g]=y(""),[m,h]=y(!1),[b,x]=y([]),[v,w]=y(!1),$=ee(!1);L(()=>{t&&(i(0),g(""),h(!1),w(!1))},[t]),L(()=>{t&&(d(!0),ya().then(E=>{l(E||null)}).catch(E=>{N(E.message||"Could not load node connect command","error")}).finally(()=>{d(!1)}))},[t]);let S=F(()=>{let E=new Set,M=[];for(let R of e){let B=String(R?.nodeId||"").trim();!B||E.has(B)||R?.paired!==!1&&(E.add(B),M.push({nodeId:B,displayName:String(R?.displayName||R?.name||B),connected:R?.connected===!0}))}return M},[e]),C=F(()=>S.find(E=>E.nodeId===String(f||"").trim())||null,[S,f]),_=F(()=>{if(!a)return"";let E=String(a.gatewayHost||"").trim()||"localhost",M=Number(a.gatewayPort)||3e3,R=String(a.gatewayToken||"").trim(),B=a.tls===!0?" --tls":"",I=String(u||"").trim().replace(/"/g,'\\"');return[R?`OPENCLAW_GATEWAY_TOKEN=${R}`:"","openclaw node run",`--host ${E}`,`--port ${M}`,B.trim(),I?`--display-name "${I}"`:""].filter(Boolean).join(" ")},[a,u]),k=q(async()=>{if(!$.current){$.current=!0;try{await n();let E=await ga(),M=Array.isArray(E?.pending)?E.pending:[];x(M)}finally{$.current=!1}}},[n]);L(()=>{if(!t||r!==1)return;let E=!0,M=async()=>{if(E)try{await k()}catch{}};M();let R=setInterval(M,Yw);return()=>{E=!1,clearInterval(R)}},[k,r,t]),L(()=>{if(!t||r!==1)return;let E=S.some(B=>B.nodeId===String(f||"").trim()),M=String(u||"").trim().toLowerCase(),R=S.find(B=>String(B?.displayName||"").trim().toLowerCase()===M)||S[0];R&&(E&&String(f||"").trim()===R.nodeId||g(R.nodeId))},[u,S,f,r,t]);let A=q(async E=>{try{await ba(E),N("Pairing approved","success"),w(!0),await k()}catch(M){N(M.message||"Could not approve pairing","error")}},[k]),O=q(async E=>{try{await xa(E),N("Pairing rejected","info"),await k()}catch(M){N(M.message||"Could not reject pairing","error")}},[k]),D=q(async()=>{let E=String(f||"").trim();if(!E||m)return!1;h(!0);try{return await Lm(E),s(!0),N("Gateway routing now points to the selected node","success"),!0}catch(M){return N(M.message||"Could not configure gateway node routing","error"),!1}finally{h(!1)}},[m,s,f]),z=q(()=>{o()},[o]);return{step:r,setStep:i,connectInfo:a,loadingConnectInfo:c,displayName:u,setDisplayName:p,selectedNodeId:f,setSelectedNodeId:g,pairedNodes:S,selectedPairedNode:C,devicePending:b,approvedInSession:v,configuring:m,canFinish:v&&!!C?.connected,connectCommand:_,refreshNodeList:k,nodeDiscoveryPollIntervalMs:Yw,handleDeviceApprove:A,handleDeviceReject:O,applyGatewayNodeRouting:D,completeWizard:z}};var an=P.bind(T),Ui=["Install OpenClaw CLI","Connect Node"],Qw=({command:t="",onCopy:e=()=>{}})=>an`
  <div class="rounded-lg border border-border bg-field p-3">
    <pre
      class="pt-1 pl-2 text-[11px] leading-5 whitespace-pre-wrap break-all font-mono text-body"
    >
${t}</pre
    >
    <div class="pt-3">
      <button
        type="button"
        onclick=${e}
        class="text-xs px-2 py-1 rounded-lg ac-btn-ghost inline-flex items-center gap-1.5"
      >
        <${Us} className="w-3.5 h-3.5" />
        Copy
      </button>
    </div>
  </div>
`,e1=async(t,e="text")=>{if(await Ho(t)){N("Copied to clipboard","success");return}N(`Could not copy ${e}`,"error")},t1=({visible:t=!1,nodes:e=[],refreshNodes:n=async()=>{},onRestartRequired:s=()=>{},onClose:o=()=>{}})=>{let r=Xw({visible:t,nodes:e,refreshNodes:n,onRestartRequired:s,onClose:o}),i=r.step===Ui.length-1;return an`
    <${De}
      visible=${t}
      onClose=${o}
      closeOnOverlayClick=${!1}
      closeOnEscape=${!1}
      panelClassName="relative bg-modal border border-border rounded-xl p-6 max-w-2xl w-full space-y-4"
    >
      <button
        type="button"
        onclick=${o}
        class="absolute top-6 right-6 h-8 w-8 inline-flex items-center justify-center rounded-lg ac-btn-secondary"
        aria-label="Close modal"
      >
        <${nt} className="w-3.5 h-3.5 text-body" />
      </button>

      <div class="text-xs text-fg-muted">Node Setup Wizard</div>
      <div class="flex items-center gap-1">
        ${Ui.map((a,l)=>an`
            <div
              class=${`h-1 flex-1 rounded-full transition-colors ${l<=r.step?"bg-accent":"bg-border"}`}
              style=${l<=r.step?"background: var(--accent)":""}
            ></div>
          `)}
      </div>
      <h3 class="font-semibold text-base">
        Step ${r.step+1} of ${Ui.length}: ${Ui[r.step]}
      </h3>

      ${r.step===0?an`
              <div class="text-xs text-fg-muted">
                Install OpenClaw on the machine you want to connect as a node.
              </div>
              ${Qw({command:"npm install -g openclaw",onCopy:()=>e1("npm install -g openclaw","command")})}
              <div class="text-xs text-fg-muted">Requires Node.js 22+.</div>
            `:null}

      ${r.step===1?an`
              <div class="space-y-2">
                <label class="space-y-1 block">
                  <div class="text-xs text-fg-muted">Display name</div>
                  <input
                    type="text"
                    value=${r.displayName}
                    oninput=${a=>r.setDisplayName(a.target.value)}
                    class="w-full bg-field border border-border rounded-lg px-2.5 py-2 text-xs font-mono focus:border-fg-muted focus:outline-none"
                  />
                </label>

                <div>
                  <div class="text-xs text-fg-muted mb-1">
                    Run this on the device you want to connect:
                  </div>
                  ${r.loadingConnectInfo?an`<div class="text-xs text-fg-muted">
                        Loading command...
                      </div>`:Qw({command:r.connectCommand||"Could not build connect command.",onCopy:()=>e1(r.connectCommand||"","command")})}
                </div>
                ${r.devicePending.length?an`
                      <${xc}
                        pending=${r.devicePending}
                        onApprove=${r.handleDeviceApprove}
                        onReject=${r.handleDeviceReject}
                      />
                    `:r.selectedPairedNode&&!r.selectedPairedNode.connected?an`
                        <div
                          class="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-status-warning"
                        >
                          Node is paired but currently disconnected. Run the
                          node command again on your device, then Finish will
                          enable.
                        </div>
                      `:an`
                        <div
                          class="rounded-lg border border-border bg-field px-3 py-2 text-xs text-fg-muted"
                        >
                          Pairing request will show up here. Checks every 3s.
                        </div>
                      `}
              </div>
            `:null}

      <div class="grid grid-cols-2 gap-2 pt-2">
        ${r.step===0?an`<div></div>`:an`
                <${Z}
                  onClick=${()=>r.setStep(Math.max(0,r.step-1))}
                  idleLabel="Back"
                  tone="secondary"
                  size="md"
                  className="w-full justify-center"
                />
              `}
        ${i?an`
                <${Z}
                  onClick=${async()=>{await r.applyGatewayNodeRouting()&&(r.completeWizard(),Promise.resolve(n()).catch(()=>{}))}}
                  loading=${r.configuring}
                  idleLabel=${r.canFinish?"Finish":"Awaiting pairing"}
                  loadingLabel="Finishing..."
                  tone="primary"
                  size="md"
                  className="w-full justify-center"
                  disabled=${!r.canFinish}
                />
              `:an`
                <${Z}
                  onClick=${()=>r.setStep(Math.min(Ui.length-1,r.step+1))}
                  idleLabel="Next"
                  tone="primary"
                  size="md"
                  className="w-full justify-center"
                />
              `}
      </div>
    </${De}>
  `};var n1=P.bind(T),s1=({onRestartRequired:t=()=>{}})=>{let{state:e,actions:n}=zw();return n1`
    <div class="space-y-4">
      <${Ne}
        title="Nodes"
        actions=${n1`
          <${Z}
            onClick=${n.refreshNodes}
            loading=${e.refreshingNodes}
            loadingMode="inline"
            idleLabel="Refresh"
            tone="secondary"
            size="sm"
          />
          <${Z}
            onClick=${n.openWizard}
            idleLabel="Connect Node"
            tone="primary"
            size="sm"
          />
        `}
      />

      <${Jw}
        nodes=${e.nodes}
        pending=${e.pending}
        loading=${e.loadingNodes}
        error=${e.nodesError}
        connectInfo=${e.connectInfo}
        onRefreshNodes=${n.refreshNodes}
      />

      <${Zw} />

      <${t1}
        visible=${e.wizardVisible}
        nodes=${e.nodes}
        refreshNodes=${n.refreshNodes}
        onRestartRequired=${t}
        onClose=${n.closeWizard}
      />
    </div>
  `};var dR=P.bind(T),mf=({onRestartRequired:t=()=>{}})=>dR`
  <div class="pt-4 max-w-2xl w-full mx-auto">
    <${s1} onRestartRequired=${t} />
  </div>
`;var NU=P.bind(T);var OU=Object.values(Mn).flat().map(t=>t.key).filter((t,e,n)=>n.indexOf(t)===e);var jU=P.bind(T);var Ki=({to:t})=>{let[,e]=ca();return L(()=>{e(t)},[t,e]),null};var Gi=(t,e)=>{let n=String(e||"").trim();n&&t.set("accountId",n)},o1=async({accountId:t=""}={})=>{let e=new URLSearchParams;Gi(e,t);let n=e.toString()?`?${e.toString()}`:"";return(await Y(`/api/telegram/bot${n}`)).json()},r1=async({accountId:t=""}={})=>{let e=new URLSearchParams;Gi(e,t);let n=e.toString()?`?${e.toString()}`:"";return(await Y(`/api/telegram/workspace${n}`)).json()},i1=async({accountId:t=""}={})=>{let e=new URLSearchParams;Gi(e,t);let n=e.toString()?`?${e.toString()}`:"";return(await Y(`/api/telegram/workspace/reset${n}`,{method:"POST"})).json()},a1=async(t,{accountId:e=""}={})=>(await Y("/api/telegram/groups/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({groupId:t,accountId:e})})).json(),_c=async(t,{accountId:e=""}={})=>{let n=new URLSearchParams;Gi(n,e);let s=n.toString()?`?${n.toString()}`:"";return(await Y(`/api/telegram/groups/${encodeURIComponent(t)}/topics${s}`)).json()},Mc=async(t,e,{accountId:n=""}={})=>(await Y(`/api/telegram/groups/${encodeURIComponent(t)}/topics/bulk`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topics:e,accountId:n})})).json(),Ac=async(t,e,{accountId:n=""}={})=>{let s=new URLSearchParams;Gi(s,n);let o=s.toString()?`?${s.toString()}`:"";return(await Y(`/api/telegram/groups/${encodeURIComponent(t)}/topics/${e}${o}`,{method:"DELETE"})).json()},l1=async(t,e,n,{accountId:s=""}={})=>(await Y(`/api/telegram/groups/${encodeURIComponent(t)}/topics/${encodeURIComponent(e)}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({...n,accountId:s})})).json(),c1=async(t,e,{accountId:n=""}={})=>(await Y(`/api/telegram/groups/${encodeURIComponent(t)}/configure`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...e,accountId:n})})).json();var At=P.bind(T),d1=({currentStep:t,steps:e})=>At`
  <div class="flex items-center gap-1 mb-6">
    ${e.map((n,s)=>At`
        <div
          class="h-1 flex-1 rounded-full transition-colors ${s<=t?"bg-accent":"bg-border"}"
          style=${s<=t?"background: var(--accent)":""}
        />
      `)}
  </div>
`,u1=({accountId:t,botInfo:e,setBotInfo:n,onNext:s})=>{let[o,r]=y(!1),[i,a]=y(null),l=async()=>{r(!0),a(null);try{let c=await o1({accountId:t});if(!c.ok)throw new Error(c.error);n(c.bot)}catch(c){a(c.message)}r(!1)};return L(()=>{e||l()},[]),At`
    <div class="space-y-4">
      <h3 class="text-sm font-semibold">Verify Bot Setup</h3>

      ${e&&At`
        <div class="bg-field border border-border rounded-lg p-3">
          <div class="flex items-center gap-2">
            <span class="text-sm text-body font-medium">@${e.username}</span>
            <${ae} tone="success">Connected</${ae}>
          </div>
          <p class="text-xs text-fg-muted mt-1">${e.first_name}</p>
        </div>
      `}
      ${i&&At`
        <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p class="text-sm text-status-error-muted">${i}</p>
        </div>
      `}
      ${!e&&!o&&!i&&At` <p class="text-sm text-fg-muted">Checking bot token...</p> `}

      <div class="bg-field border border-border rounded-lg p-3 space-y-2">
        <p class="text-xs font-medium text-body">
          Before continuing, configure BotFather:
        </p>
        <ol class="text-xs text-fg-muted space-y-1.5 list-decimal list-inside">
          <li>
            Open <span class="text-body">@BotFather</span> in Telegram
          </li>
          <li>
            Send <code class="bg-field px-1 rounded">/mybots</code> and
            select your bot
          </li>
          <li>
            Go to <span class="text-body">Bot Settings</span> >
            <span class="text-body">Group Privacy</span>
          </li>
          <li>Turn it <span class="text-status-warning-muted font-medium">OFF</span></li>
        </ol>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div />
        <button
          onclick=${s}
          disabled=${!e}
          class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all ac-btn-cyan ${e?"":"opacity-50 cursor-not-allowed"}"
        >
          Next
        </button>
      </div>
    </div>
  `},p1=({onNext:t,onBack:e})=>At`
  <div class="space-y-4">
    <h3 class="text-sm font-semibold">Create a Telegram Group</h3>

    <div class="bg-field border border-border rounded-lg p-3 space-y-2">
      <p class="text-xs font-medium text-body">Create the group</p>
      <ol class="text-xs text-fg-muted space-y-2 list-decimal list-inside">
        <li>
          Open Telegram and create a${" "}
          <span class="text-body">new group</span>
        </li>
        <li>
          Search for and add <span class="text-body">your bot</span> as a
          member
        </li>
        <li>
          Hit <span class="text-body">Next</span>, give the group a name
          (e.g. "My Workspace"), and create it
        </li>
      </ol>
    </div>

    <div class="bg-field border border-border rounded-lg p-3 space-y-2">
      <p class="text-xs font-medium text-body">Enable topics</p>
      <ol class="text-xs text-fg-muted space-y-2 list-decimal list-inside">
        <li>Tap the group name at the top to open settings</li>
        <li>
          Tap <span class="text-body">Edit</span> (pencil icon), scroll to
          <span class="text-body"> Topics</span>, toggle it
          <span class="text-status-warning-muted font-medium"> ON</span>
        </li>
      </ol>
    </div>

    <div class="bg-field border border-border rounded-lg p-3 space-y-2">
      <p class="text-xs font-medium text-body">Make the bot an admin</p>
      <ol class="text-xs text-fg-muted space-y-2 list-decimal list-inside">
        <li>Go to <span class="text-body">Members</span>, tap your bot</li>
        <li>
          Promote it to <span class="text-status-warning-muted font-medium">Admin</span>
        </li>
        <li>
          Make sure
          <span class="text-status-warning-muted font-medium"> Manage Topics </span>
          permission is enabled
        </li>
      </ol>
    </div>

    <p class="text-xs text-fg-muted">
      Once all three steps are done, continue to verify the setup.
    </p>

    <div class="grid grid-cols-2 gap-2">
      <button
        onclick=${e}
        class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all border border-border text-body hover:border-fg-muted"
      >
        Back
      </button>
      <button
        onclick=${t}
        class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all ac-btn-cyan"
      >
        Next
      </button>
    </div>
  </div>
`,f1=({accountId:t,groupId:e,setGroupId:n,groupInfo:s,setGroupInfo:o,userId:r,setUserId:i,verifyGroupError:a,setVerifyGroupError:l,onNext:c,onBack:d})=>{let[u,p]=y(e||""),[f,g]=y(!1),[m,h]=y(!1),b=s?[...s.chat?.isForum?[]:["Topics are OFF. Enable Topics in Telegram group settings."],...s.bot?.isAdmin?[]:["Bot is not an admin. Promote it to admin in group members."],...s.bot?.canManageTopics?[]:["Bot is missing Manage Topics permission. Enable it in admin permissions."]]:[],x=async()=>{let $=u.trim();if($){g(!0),l(null);try{let S=await a1($,{accountId:t});if(!S.ok)throw new Error(S.error);n($),o(S),!String(r||"").trim()&&S.suggestedUserId&&i(String(S.suggestedUserId))}catch(S){l(S.message),o(null)}g(!1)}},v=!!(s&&s.chat?.isForum&&s.bot?.isAdmin&&s.bot?.canManageTopics),w=async()=>{if(!(!v||m)){l(null),h(!0);try{let $=String(r||"").trim(),S=await c1(e,{...$?{userId:$}:{},groupName:s?.chat?.title||e,requireMention:!1},{accountId:t});if(!S?.ok)throw new Error(S?.error||"Failed to configure Telegram group");S.userId&&i(String(S.userId)),c()}catch($){l($.message)}h(!1)}};return At`
    <div class="space-y-4">
      <h3 class="text-sm font-semibold">Verify Group</h3>

      <div class="bg-field border border-border rounded-lg p-3 space-y-2">
        <p class="text-xs text-fg-muted">To get your group chat ID:</p>
        <ol class="text-xs text-fg-muted space-y-1 list-decimal list-inside">
          <li>
            Invite <span class="text-body">@myidbot</span> to your group
          </li>
          <li>
            Send <code class="bg-field px-1 rounded">/getgroupid</code>
          </li>
          <li>
            Copy the ID (starts with
            <code class="bg-field px-1 rounded">-100</code>)
          </li>
        </ol>
      </div>

      <div class="flex gap-2">
        <input
          type="text"
          value=${u}
          onInput=${$=>p($.target.value)}
          placeholder="-100XXXXXXXXXX"
          class="flex-1 bg-field border border-border rounded-lg px-3 py-2 text-sm text-body placeholder-fg-dim focus:outline-none focus:border-fg-muted"
        />
        <${Z}
          onClick=${x}
          disabled=${!u.trim()||f}
          loading=${f}
          tone="secondary"
          size="md"
          idleLabel="Verify"
          loadingMode="inline"
          className="rounded-lg"
        />
      </div>

      ${a&&At`
        <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p class="text-sm text-status-error-muted">${a}</p>
        </div>
      `}
      ${s&&At`
        <div class="bg-field border border-border rounded-lg p-3 space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-sm text-body font-medium">${s.chat.title}</span>
            <${ae} tone="success">Verified</${ae}>
          </div>
          <div class="flex gap-3 text-xs text-fg-muted">
            <span>Topics: ${s.chat.isForum?"ON":"OFF"}</span>
            <span>Bot: ${s.bot.status}</span>
          </div>
        </div>
      `}
      ${s&&b.length===0&&At`
        <div class="bg-field border border-border rounded-lg p-3 space-y-2">
          <p class="text-xs text-fg-muted">Your Telegram User ID</p>
          <input
            type="text"
            value=${r}
            onInput=${$=>i($.target.value)}
            placeholder="e.g. 123456789"
            class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm text-body placeholder-fg-dim focus:outline-none focus:border-fg-muted"
          />
          <p class="text-xs text-fg-muted">
            Auto-filled from Telegram admins. Edit if needed.
          </p>
        </div>
      `}
      ${b.length>0&&At`
        <div
          class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-3"
        >
          <p class="text-xs font-medium text-status-error">
            Fix these before continuing:
          </p>
          <ul class="text-xs text-status-error space-y-1 list-disc list-inside">
            ${b.map($=>At`<li>${$}</li>`)}
          </ul>
          <p class="text-xs text-status-error ">Once fixed, hit Verify again.</p>
        </div>
      `}

      <div class="grid grid-cols-2 gap-2">
        <button
          onclick=${d}
          class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all border border-border text-body hover:border-fg-muted"
        >
          Back
        </button>
        <button
          onclick=${w}
          disabled=${!v||m}
          class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all ac-btn-cyan ${!v||m?"opacity-50 cursor-not-allowed":""}"
        >
          ${m?"Saving...":"Next"}
        </button>
      </div>
    </div>
  `},h1=({accountId:t,groupId:e,topics:n,setTopics:s,onNext:o,onBack:r})=>{let[i,a]=y(""),[l,c]=y(""),[d,u]=y(!1),[p,f]=y(null),[g,m]=y(null),[h,b]=y(null),x=async()=>{let S=await _c(e,{accountId:t});S.ok&&s(S.topics)};L(()=>{x()},[e]);let v=async()=>{let S=i.trim(),C=l.trim();if(S){u(!0),f(null);try{let _=await Mc(e,[{name:S,...C?{systemInstructions:C}:{}}],{accountId:t});if(!_.ok)throw new Error(_.results?.[0]?.error||"Failed to create topic");let k=_.results.filter(A=>!A.ok);if(k.length>0)throw new Error(k[0].error);a(""),c(""),await x(),N(`Created topic: ${S}`,"success")}catch(_){f(_.message)}u(!1)}},w=async(S,C)=>{m(S);try{let _=await Ac(e,S,{accountId:t});if(!_.ok)throw new Error(_.error);await x(),_.removedFromRegistryOnly?N(`Removed stale topic from registry: ${C}`,"success"):N(`Deleted topic: ${C}`,"success")}catch(_){N(`Failed to delete: ${_.message}`,"error")}m(null)},$=Object.entries(n||{});return At`
    <div class="space-y-4">
      <h3 class="text-sm font-semibold">Create Topics</h3>

      ${$.length>0&&At`
        <div
          class="bg-field border border-border rounded-lg overflow-hidden"
        >
          <table class="w-full text-xs">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left px-3 py-2 text-fg-muted font-medium">
                  Topic
                </th>
                <th class="text-left px-3 py-2 text-fg-muted font-medium">
                  Thread ID
                </th>
                <th class="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              ${$.map(([S,C])=>At`
                  <tr class="border-b border-border last:border-0">
                    <td class="px-3 py-2 text-body">${C.name}</td>
                    <td class="px-3 py-2 text-fg-muted font-mono">${S}</td>
                    <td class="px-3 py-2">
                      <button
                        onclick=${()=>b({id:String(S),name:String(C.name||"")})}
                        disabled=${g===S}
                        class="text-fg-dim hover:text-status-error-muted transition-colors ${g===S?"opacity-50":""}"
                        title="Delete topic"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path
                            d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                `)}
            </tbody>
          </table>
        </div>
      `}

      <div class="space-y-2">
        <label class="text-xs text-fg-muted">Add a topic</label>
        <div class="space-y-2">
          <div class="flex gap-2">
            <input
              type="text"
              value=${i}
              onInput=${S=>a(S.target.value)}
              onKeyDown=${S=>{S.key==="Enter"&&v()}}
              placeholder="Topic name"
              class="flex-1 bg-field border border-border rounded-lg px-3 py-2 text-sm text-body placeholder-fg-dim focus:outline-none focus:border-fg-muted"
            />
          </div>
          <textarea
            value=${l}
            onInput=${S=>c(S.target.value)}
            placeholder="System instructions (optional)"
            rows="4"
            class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm text-body placeholder-fg-dim focus:outline-none focus:border-fg-muted resize-y"
          />
          <div class="flex justify-end">
            <${Z}
              onClick=${v}
              disabled=${d||!i.trim()}
              loading=${d}
              tone="secondary"
              size="lg"
              idleLabel="Add"
              loadingMode="inline"
              className="min-w-[88px]"
            />
          </div>
        </div>
      </div>
      <div class="border-t border-white/10 pt-2" />

      ${p&&At`
        <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p class="text-sm text-status-error-muted">${p}</p>
        </div>
      `}

      <div class="grid grid-cols-2 gap-2">
        <button
          onclick=${r}
          class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all border border-border text-body hover:border-fg-muted"
        >
          Back
        </button>
        <button
          onclick=${o}
          disabled=${$.length===0}
          class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all ac-btn-cyan"
        >
          Next
        </button>
      </div>
      <${st}
        visible=${!!h}
        title="Delete topic?"
        message=${h?`This will delete "${h.name}" (thread ${h.id}) from your Telegram workspace.`:"This will delete this topic from your Telegram workspace."}
        confirmLabel="Delete topic"
        confirmLoadingLabel="Deleting..."
        confirmTone="warning"
        confirmLoading=${!!g}
        cancelLabel="Cancel"
        onCancel=${()=>{g||b(null)}}
        onConfirm=${async()=>{if(!h)return;let S=h;b(null),await w(S.id,S.name)}}
      />
    </div>
  `},m1=({groupId:t,groupInfo:e,topics:n,onBack:s,onDone:o})=>At`
    <div class="space-y-4">
      <div class="max-w-xl mx-auto text-center space-y-10 mt-10">
        <p class="text-sm font-medium text-status-success">🎉 Setup complete</p>
        <p class="text-xs text-fg-muted">
          The topic registry has been injected into
          <code class="bg-field px-1 rounded">TOOLS.md</code> so your agent
          knows which thread ID maps to which topic name.
        </p>

        <div class="bg-field border border-border rounded-lg p-3">
          <p class="text-xs text-fg-muted">
            If you used <span class="text-body">@myidbot</span> to find IDs,
            you can remove it from the group now.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button
          onclick=${s}
          class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all border border-border text-body hover:border-fg-muted"
        >
          Back
        </button>
        <button
          onclick=${o}
          class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all ac-btn-cyan"
        >
          Done
        </button>
      </div>
    </div>
  `;var Tt=P.bind(T),g1=({value:t,agents:e,onChange:n,className:s=""})=>Tt`
  <select
    value=${t}
    onChange=${o=>n(o.target.value)}
    class="bg-field border border-border rounded-lg px-2 py-1.5 text-xs text-body focus:outline-none focus:border-fg-muted ${s}"
  >
    <option value="">Default</option>
    ${e.map(o=>Tt`<option value=${o.id}>${o.name||o.id}</option>`)}
  </select>
`,bf=({accountId:t,groupId:e,groupName:n,initialTopics:s,configAgentMaxConcurrent:o,configSubagentMaxConcurrent:r,debugEnabled:i,onResetOnboarding:a})=>{let[l,c]=y(s||{}),[d,u]=y(""),[p,f]=y(""),[g,m]=y(""),[h,b]=y(!1),[x,v]=y(!1),[w,$]=y(null),[S,C]=y(""),[_,k]=y(""),[A,O]=y(""),[D,z]=y(""),[E,M]=y(""),[R,B]=y(null),[I,U]=y(null),[W,G]=y([]),se=async()=>{let V=await _c(e,{accountId:t});V.ok&&c(V.topics||{})};L(()=>{se()},[e]),L(()=>{s&&Object.keys(s).length>0&&c(s)},[s]),L(()=>{Ao().then(V=>G(Array.isArray(V?.agents)?V.agents:[])).catch(()=>{})},[]);let K=async()=>{let V=d.trim(),J=p.trim(),oe=g.trim();if(V){v(!0),B(null);try{let ce=await Mc(e,[{name:V,...J?{systemInstructions:J}:{},...oe?{agentId:oe}:{}}],{accountId:t});if(!ce.ok)throw new Error(ce.results?.[0]?.error||"Failed to create topic");let be=ce.results.filter(Ve=>!Ve.ok);if(be.length>0)throw new Error(be[0].error);u(""),f(""),m(""),b(!1),await se(),N(`Created topic: ${V}`,"success")}catch(ce){B(ce.message)}v(!1)}},j=async(V,J)=>{$(V);try{let oe=await Ac(e,V,{accountId:t});if(!oe.ok)throw new Error(oe.error);await se(),oe.removedFromRegistryOnly?N(`Removed stale topic from registry: ${J}`,"success"):N(`Deleted topic: ${J}`,"success")}catch(oe){N(`Failed to delete: ${oe.message}`,"error")}$(null)},X=(V,J,oe="",ce="")=>{C(String(V)),k(String(J||"")),O(String(oe||"")),z(String(ce||""))},de=()=>{C(""),k(""),O(""),z("")},le=async V=>{let J=_.trim(),oe=A.trim(),ce=D.trim();if(!J){B("Topic name is required");return}M(String(V)),B(null);try{let be=await l1(e,V,{name:J,systemInstructions:oe,agentId:ce},{accountId:t});if(!be.ok)throw new Error(be.error||"Failed to update topic");await se(),N(`Updated topic: ${J}`,"success"),de()}catch(be){B(be.message)}M("")},ie=Object.entries(l||{}),ne=ie.length,xe=Math.max(ne*3,8),he=Math.max(xe-2,4),ue=Number.isFinite(o)?o:xe,me=Number.isFinite(r)?r:he;return Tt`
    <div class="space-y-4">
      ${i&&Tt`
        <div class="flex justify-end">
          <button
            onclick=${a}
            class="text-xs px-3 py-1.5 rounded-lg border border-border text-fg-muted hover:text-body hover:border-fg-muted transition-colors"
          >
            Reset onboarding
          </button>
        </div>
      `}
      <div class="bg-field border border-border rounded-lg p-3 space-y-1">
        <p class="text-sm text-body font-medium">${n||e}</p>
        <p class="text-xs text-fg-muted font-mono">${e}</p>
      </div>

      <div class="space-y-2">
        <h2 class="card-label mb-3">Existing Topics</h2>
        ${ie.length>0?Tt`
              <div
                class="bg-field border border-border rounded-lg overflow-hidden"
              >
                <table class="w-full text-xs table-fixed">
                  <thead>
                    <tr class="border-b border-border">
                      <th class="text-left px-3 py-2 text-fg-muted font-medium">
                        Topic
                      </th>
                      <th
                        class="text-left px-3 py-2 text-fg-muted font-medium w-36"
                      >
                        Thread ID
                      </th>
                      ${W.length>0&&Tt`
                        <th
                          class="text-left px-3 py-2 text-fg-muted font-medium w-32"
                        >
                          Agent
                        </th>
                      `}
                      <th class="px-3 py-2 w-28" />
                    </tr>
                  </thead>
                  <tbody>
                    ${ie.map(([V,J])=>Tt`
                        ${S===String(V)?Tt`
                              <tr
                                class="border-b border-border last:border-0 align-top"
                              >
                                <td class="px-3 py-2" colspan=${W.length>0?4:3}>
                                  <div class="space-y-2">
                                    <input
                                      type="text"
                                      value=${_}
                                      onInput=${oe=>k(oe.target.value)}
                                      onKeyDown=${oe=>{oe.key==="Enter"&&le(V),oe.key==="Escape"&&de()}}
                                      class="w-full bg-field border border-border rounded-lg px-2 py-1.5 text-xs text-body placeholder-fg-dim focus:outline-none focus:border-fg-muted"
                                    />
                                    <textarea
                                      value=${A}
                                      onInput=${oe=>O(oe.target.value)}
                                      placeholder="System instructions (optional)"
                                      rows="6"
                                      class="w-full bg-field border border-border rounded-lg px-2 py-1.5 text-xs text-body placeholder-fg-dim focus:outline-none focus:border-fg-muted resize-y"
                                    />
                                    ${W.length>0&&Tt`
                                      <div class="flex items-center gap-2">
                                        <label class="text-xs text-fg-muted">Agent:</label>
                                        <${g1}
                                          value=${D}
                                          agents=${W}
                                          onChange=${z}
                                        />
                                      </div>
                                    `}
                                    <div class="flex items-center gap-2">
                                      <button
                                        onclick=${()=>le(V)}
                                        disabled=${E===String(V)}
                                        class="text-xs px-2 py-1 rounded transition-all ac-btn-cyan ${E===String(V)?"opacity-50 cursor-not-allowed":""}"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onclick=${de}
                                        class="text-xs px-2 py-1 rounded border border-border text-fg-muted hover:text-body hover:border-fg-muted"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            `:Tt`
                              <tr
                                class="border-b border-border last:border-0 align-middle"
                              >
                                <td class="px-3 py-2 text-body">
                                  <div class="flex items-center gap-2">
                                    <span>${J.name}</span>
                                    <button
                                      onclick=${()=>X(V,J.name,J.systemInstructions,J.agentId)}
                                      class="inline-flex items-center justify-center text-white/80 hover:text-white transition-colors"
                                      title="Edit topic"
                                      aria-label="Edit topic"
                                    >
                                      <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 16 16"
                                        fill="currentColor"
                                        aria-hidden="true"
                                      >
                                        <path
                                          d="M11.854 1.146a.5.5 0 00-.708 0L3 9.293V13h3.707l8.146-8.146a.5.5 0 000-.708l-3-3zM3.5 12.5v-2.793l7-7L13.793 6l-7 7H3.5z"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                  ${J.systemInstructions&&Tt`
                                    <p
                                      class="text-[11px] text-fg-muted mt-1 line-clamp-1"
                                    >
                                      ${J.systemInstructions}
                                    </p>
                                  `}
                                </td>
                                <td
                                  class="px-3 py-2 text-fg-muted font-mono w-36"
                                >
                                  ${V}
                                </td>
                                ${W.length>0&&Tt`
                                  <td class="px-3 py-2 text-fg-muted w-32">
                                    ${J.agentId?Tt`<span class="text-body">${W.find(oe=>oe.id===J.agentId)?.name||J.agentId}</span>`:Tt`<span class="text-fg-dim">default</span>`}
                                  </td>
                                `}
                                <td class="px-3 py-2">
                                  <div
                                    class="flex items-center gap-2 justify-end"
                                  >
                                    <button
                                      onclick=${()=>U({id:String(V),name:String(J.name||"")})}
                                      disabled=${w===V}
                                      class="text-xs px-2 py-1 rounded border border-border text-fg-muted hover:text-status-error hover:border-red-500 ${w===V?"opacity-50 cursor-not-allowed":""}"
                                      title="Delete topic"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            `}
                      `)}
                  </tbody>
                </table>
              </div>
            `:Tt`<p class="text-xs text-fg-muted">No topics yet.</p>`}
      </div>

      ${h&&Tt`
        <div class="space-y-2 bg-field border border-border rounded-lg p-3">
          <label class="text-xs text-fg-muted">Create new topic</label>
          <div class="space-y-2">
            <input
              type="text"
              value=${d}
              onInput=${V=>u(V.target.value)}
              onKeyDown=${V=>{V.key==="Enter"&&K()}}
              placeholder="Topic name"
              class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm text-body placeholder-fg-dim focus:outline-none focus:border-fg-muted"
            />
            <textarea
              value=${p}
              onInput=${V=>f(V.target.value)}
              placeholder="System instructions (optional)"
              rows="5"
              class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm text-body placeholder-fg-dim focus:outline-none focus:border-fg-muted resize-y"
            />
            ${W.length>0&&Tt`
              <div class="flex items-center gap-2">
                <label class="text-xs text-fg-muted">Agent:</label>
                <${g1}
                  value=${g}
                  agents=${W}
                  onChange=${m}
                />
              </div>
            `}
            <div class="flex justify-end">
              <${Z}
                onClick=${K}
                disabled=${x||!d.trim()}
                loading=${x}
                tone="secondary"
                size="lg"
                idleLabel="Add topic"
                loadingLabel="Creating..."
              />
            </div>
          </div>
        </div>
      `}
      ${R&&Tt`
        <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p class="text-sm text-status-error-muted">${R}</p>
        </div>
      `}

      <div class="flex items-center justify-start">
        <button
          onclick=${()=>b(V=>!V)}
          class="${h?"w-auto text-sm font-medium px-4 py-2 rounded-xl transition-all border border-border text-body hover:border-fg-muted":"w-auto text-sm font-medium px-4 py-2 rounded-xl transition-all ac-btn-cyan"}"
        >
          ${h?"Close create topic":"Create topic"}
        </button>
      </div>

      <div class="border-t border-white/10" />

      <p class="text-xs text-fg-muted">
        Concurrency is auto-scaled to support your group:
        <span class="text-body"> agent ${ue}</span>,
        <span class="text-body"> subagent ${me}</span>
        <span class="text-fg-dim"> (${ne} topics)</span>.
      </p>
      <p class="text-[11px] text-fg-muted">
        This registry can drift if topics are created, renamed, or removed
        outside this page. Your agent will update the registry if it notices a
        discrepancy.
      </p>
      <${st}
        visible=${!!I}
        title="Delete topic?"
        message=${I?`This will delete "${I.name}" (thread ${I.id}) from your Telegram workspace.`:"This will delete this topic from your Telegram workspace."}
        confirmLabel="Delete topic"
        confirmLoadingLabel="Deleting..."
        confirmTone="warning"
        confirmLoading=${!!w}
        cancelLabel="Cancel"
        onCancel=${()=>{w||U(null)}}
        onConfirm=${async()=>{if(!I)return;let V=I;U(null),await j(V.id,V.name)}}
      />
    </div>
  `};var jt=P.bind(T),Tc=[{id:"verify-bot",label:"Verify Bot"},{id:"create-group",label:"Create Group"},{id:"add-bot",label:"Add Bot"},{id:"topics",label:"Topics"},{id:"summary",label:"Summary"}],Sr=(t,e)=>{let n=String(e||"").trim();return!n||n==="default"?t:`${t}.${n}`},uR=t=>{try{let e=window.localStorage.getItem(Sr(Ha,t));if(!e)return{};let n=JSON.parse(e);return n&&typeof n=="object"?n:{}}catch{return{}}},pR=(t,e)=>{try{window.localStorage.setItem(Sr(Ha,t),JSON.stringify(e))}catch{}},b1=t=>{try{window.localStorage.removeItem(Sr(Ha,t))}catch{}},fR=t=>{try{let e=window.localStorage.getItem(Sr(Wa,t));if(!e)return null;let s=JSON.parse(e)?.data;return!s||typeof s!="object"?null:s}catch{return null}},xf=(t,e)=>{try{window.localStorage.setItem(Sr(Wa,t),JSON.stringify({cachedAt:Date.now(),data:e}))}catch{}},hR=t=>{try{window.localStorage.removeItem(Sr(Wa,t))}catch{}},mR=({onBack:t})=>jt`
  <button
    onclick=${t}
    class="flex items-center gap-1.5 text-sm text-fg-muted hover:text-body transition-colors mb-4"
  >
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path
        d="M10.354 3.354a.5.5 0 00-.708-.708l-5 5a.5.5 0 000 .708l5 5a.5.5 0 00.708-.708L5.707 8l4.647-4.646z"
      />
    </svg>
    Back
  </button>
`,gR=({accountId:t,groups:e,concurrency:n,debugEnabled:s,onResetOnboarding:o})=>{let[r,i]=y(()=>e[0]?.groupId||""),a=l=>i(c=>c===l?"":l);return jt`
    <div class="space-y-3">
      ${e.map(l=>jt`
          <div
            key=${l.groupId}
            class="border border-border rounded-lg overflow-hidden"
          >
            <button
              onclick=${()=>a(l.groupId)}
              class="w-full flex items-center justify-between px-3 py-2.5 bg-field hover:bg-field transition-colors text-left"
            >
              <div>
                <p class="text-sm text-body font-medium">
                  ${l.groupName||l.groupId}
                </p>
                <p class="text-[11px] text-fg-muted font-mono">${l.groupId}</p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                class="text-fg-muted transition-transform ${r===l.groupId?"rotate-180":""}"
              >
                <path
                  d="M4.354 5.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 00-.708-.708L8 9.293 4.354 5.646z"
                />
              </svg>
            </button>
            ${r===l.groupId&&jt`
              <div class="p-3 border-t border-border">
                <${bf}
                  accountId=${t}
                  groupId=${l.groupId}
                  groupName=${l.groupName}
                  initialTopics=${l.topics}
                  configAgentMaxConcurrent=${n?.agentMaxConcurrent}
                  configSubagentMaxConcurrent=${n?.subagentMaxConcurrent}
                  debugEnabled=${s}
                  onResetOnboarding=${o}
                />
              </div>
            `}
          </div>
        `)}
    </div>
  `},x1=({accountId:t="default",onBack:e})=>{let n=uR(t),s=fR(t),[o,r]=y(()=>{let _=Number.parseInt(String(n.step??0),10);return Number.isFinite(_)?Math.min(Math.max(_,0),Tc.length-1):0}),[i,a]=y(null),[l,c]=y(n.groupId||""),[d,u]=y(n.groupInfo||null),[p,f]=y(n.verifyGroupError||null),[g,m]=y(n.allowUserId||""),[h,b]=y(n.topics||{}),[x,v]=y(()=>({ready:!!s,configured:!!s?.configured,groups:s?.groups||[],groupId:s?.groupId||"",groupName:s?.groupName||"",topics:s?.topics||{},debugEnabled:!!s?.debugEnabled,concurrency:s?.concurrency||{agentMaxConcurrent:null,subagentMaxConcurrent:null}})),w=()=>r(_=>Math.min(Tc.length-1,_+1)),$=()=>r(_=>Math.max(0,_-1)),S=async()=>{try{let _=await i1({accountId:t});if(!_.ok)throw new Error(_.error||"Failed to reset onboarding");b1(t),hR(t),r(0),a(null),c(""),u(null),f(null),m(""),b({}),v({ready:!0,configured:!1,groups:[],groupId:"",groupName:"",topics:{},debugEnabled:!!x?.debugEnabled,concurrency:{agentMaxConcurrent:null,subagentMaxConcurrent:null}}),N("Telegram onboarding reset","success")}catch(_){N(_.message||"Failed to reset onboarding","error")}},C=()=>{b1(t);let _=d?.chat?.title||l;xf(t,{ready:!0,configured:!0,groups:[{groupId:l,groupName:_,topics:h||{}}],groupId:l,groupName:_,topics:h||{},debugEnabled:!!x?.debugEnabled,concurrency:x?.concurrency||{agentMaxConcurrent:null,subagentMaxConcurrent:null}}),window.location.reload()};return L(()=>{pR(t,{step:o,groupId:l,groupInfo:d,verifyGroupError:p,allowUserId:g,topics:h})},[t,o,l,d,p,g,h]),L(()=>{let _=!0;return(async()=>{try{let A=await r1({accountId:t});if(!_||!A?.ok)return;let O=Array.isArray(A.groups)?A.groups:[];if(!A.configured||O.length===0){let E={ready:!0,configured:!1,groups:[],groupId:"",groupName:"",topics:{},debugEnabled:!!A?.debugEnabled,concurrency:{agentMaxConcurrent:null,subagentMaxConcurrent:null}};v(E),xf(t,E);return}let D=O[0],z={ready:!0,configured:!0,groups:O,groupId:D.groupId,groupName:D.groupName||D.groupId,topics:D.topics||{},debugEnabled:!!A.debugEnabled,concurrency:A.concurrency||{agentMaxConcurrent:null,subagentMaxConcurrent:null}};v(z),xf(t,z),c(D.groupId),b(D.topics||{}),u({chat:{id:D.groupId,title:D.groupName||D.groupId,isForum:!0},bot:{status:"administrator",isAdmin:!0,canManageTopics:!0}}),f(null),m(""),r(E=>E<3?3:E)}catch{}})(),()=>{_=!1}},[t]),jt`
    <div class="space-y-4">
      <${mR} onBack=${e} />
      <div class="bg-surface border border-border rounded-xl p-4">
        ${x.ready?x.configured?jt`
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <img
                      src="/assets/icons/telegram.svg"
                      alt=""
                      class="w-5 h-5"
                    />
                    <h2 class="font-semibold text-sm">
                      Manage Telegram Workspace
                    </h2>
                  </div>
                </div>
                ${(x.groups||[]).length<=1?jt`
                      <${bf}
                        accountId=${t}
                        groupId=${x.groupId}
                        groupName=${x.groupName}
                        initialTopics=${x.topics}
                        configAgentMaxConcurrent=${x.concurrency?.agentMaxConcurrent}
                        configSubagentMaxConcurrent=${x.concurrency?.subagentMaxConcurrent}
                        debugEnabled=${x.debugEnabled}
                        onResetOnboarding=${S}
                      />
                    `:jt`
                      <${gR}
                        accountId=${t}
                        groups=${x.groups}
                        concurrency=${x.concurrency}
                        debugEnabled=${x.debugEnabled}
                        onResetOnboarding=${S}
                      />
                    `}
              `:jt`
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <img
                      src="/assets/icons/telegram.svg"
                      alt=""
                      class="w-5 h-5"
                    />
                    <h2 class="font-semibold text-sm">
                      Set Up Telegram Workspace
                    </h2>
                  </div>
                  <span class="text-xs text-fg-muted"
                    >Step ${o+1} of ${Tc.length}</span
                  >
                </div>

                <${d1} currentStep=${o} steps=${Tc} />

                ${o===0&&jt`
                  <${u1}
                    accountId=${t}
                    botInfo=${i}
                    setBotInfo=${a}
                    onNext=${w}
                  />
                `}
                ${o===1&&jt`
                  <${p1} onNext=${w} onBack=${$} />
                `}
                ${o===2&&jt`
                  <${f1}
                    accountId=${t}
                    groupId=${l}
                    setGroupId=${c}
                    groupInfo=${d}
                    setGroupInfo=${u}
                    userId=${g}
                    setUserId=${m}
                    verifyGroupError=${p}
                    setVerifyGroupError=${f}
                    onNext=${w}
                    onBack=${$}
                  />
                `}
                ${o===3&&jt`
                  <${h1}
                    accountId=${t}
                    groupId=${l}
                    topics=${h}
                    setTopics=${b}
                    onNext=${w}
                    onBack=${$}
                  />
                `}
                ${o===4&&jt`
                  <${m1}
                    groupId=${l}
                    groupInfo=${d}
                    topics=${h}
                    onBack=${$}
                    onDone=${C}
                  />
                `}
              `:jt`
              <div class="min-h-[220px] flex items-center justify-center">
                <p class="text-sm text-fg-muted">Loading workspace...</p>
              </div>
            `}
      </div>
    </div>
  `};var bR=P.bind(T),yf=({accountId:t="default",onBack:e=()=>{}})=>bR`
  <div class="pt-4">
    <${x1} key=${t} accountId=${t} onBack=${e} />
  </div>
`;var vf=["#7dd3fc","#22d3ee","#fbbf24","#34d399","#fb7185","#a78bfa","#f472b6","#60a5fa","#4ade80","#f97316"],$f={cyan:"border-cyan-400/30 text-status-info bg-cyan-400/10",blue:"border-blue-400/30 text-blue-300 bg-blue-400/10",purple:"border-purple-400/30 text-purple-300 bg-purple-400/10",gray:"border-gray-400/30 text-fg-muted bg-gray-400/10"},y1=[{label:"7d",value:7},{label:"30d",value:30},{label:"90d",value:90}],v1=30,$1="tokens",w1="model",wf="usageDays",kf="usageMetric",Sf="usageBreakdown",k1=["chat","hooks","cron"],S1=[{label:"Model breakdown",value:"model"},{label:"Type breakdown",value:"source"},{label:"Agent breakdown",value:"agent"}];var Pc=t=>{let e=t instanceof Date?t:new Date(t??Date.now()),n=e.getFullYear(),s=String(e.getMonth()+1).padStart(2,"0"),o=String(e.getDate()).padStart(2,"0");return`${n}-${s}-${o}`},C1=t=>{let e=String(t||""),n=0;for(let s=0;s<e.length;s+=1)n=(n<<5)-n+e.charCodeAt(s)|0;return vf[Math.abs(n)%vf.length]},Cf=t=>t==="hooks"?"Hooks":t==="cron"?"Cron":"Chat",_1=(t,e)=>{let n=String(e||"model"),s=String(t||"").trim();return s?n==="source"?Cf(s):n==="agent"&&s==="unknown"?"Unknown agent":s:"Unknown"};var Sn=P.bind(T),Af=(t,e,n)=>{let s=Number(t||0),o=s===1?e:n;return`${Jt(s)} ${o}`},xR=t=>`${(Number(t||0)*100).toFixed(1)}%`,yR=t=>{let e=Number(t||0)*100;return e<=0?"text-body":e>=70?"text-status-success":e>=40?"text-amber-300":"text-status-error-muted"},vR=t=>{let e=t?.totals||{},n=Number(e.cacheReadTokens||0),s=Number(e.cacheWriteTokens||0),r=Number(e.inputTokens||0)+n+s,i=Number(e.turnCount||0),a=Number(e.totalTokens||0),l=Number(e.totalCost||0);return{cacheHitRate:r>0?n/r:0,cacheReadTokens:n,promptTokens:r,avgTokensPerTurn:i>0?a/i:0,avgCostPerTurn:i>0?l/i:0,turnCount:i}},_f=({title:t,tokens:e,cost:n})=>Sn`
  <div class="bg-surface border border-border rounded-xl p-4">
    <h3 class="card-label text-xs">${t}</h3>
    <div class="text-lg font-semibold mt-1">
      ${Jt(e)}
      <span class="text-xs text-[var(--text-muted)] ml-1">tokens</span>
    </div>
    <div class="text-xs text-[var(--text-muted)] mt-1">${gn(n)}</div>
  </div>
`,Mf=({title:t,value:e,detail:n="",valueClass:s="",valueSuffix:o=""})=>Sn`
  <div class="bg-surface border border-border rounded-xl p-4">
    <h3 class="card-label text-xs">${t}</h3>
    <div class=${`text-lg font-semibold mt-1 ${s}`.trim()}>
      ${e}
      ${o?Sn`<span class="text-xs text-[var(--text-muted)] ml-1">${o}</span>`:null}
    </div>
    <div class="text-xs text-[var(--text-muted)] mt-1">${n}</div>
  </div>
`,$R=({summary:t})=>{let e=Array.isArray(t?.costByAgent?.agents)?t.costByAgent.agents:[],n=Array.from(new Set((t?.daily||[]).flatMap(c=>c?.models||[]).filter(c=>!c?.pricingFound&&Number(c?.totalTokens||0)>0).map(c=>String(c?.model||"unknown").trim()||"unknown"))).sort((c,d)=>c.localeCompare(d)),s=n.slice(0,3).join(", "),o=n.length>3,r=n.length?o?`${s}, +${n.length-3} more`:s:"",[i,a]=y(()=>String(e[0]?.agent||""));L(()=>{if(e.length===0){i&&a("");return}e.some(d=>String(d.agent||"")===i)||a(String(e[0]?.agent||""))},[e,i]);let l=e.find(c=>String(c.agent||"")===i)||e[0]||null;return Sn`
    <div class="bg-surface border border-border rounded-xl p-4">
      ${e.length===0?Sn`
            <div
              class="flex flex-wrap items-start sm:items-center justify-between gap-3 mb-3"
            >
              <h2 class="card-label text-xs">Estimated cost breakdown</h2>
            </div>
            <p class="text-xs text-fg-muted">
              No agent usage recorded for this range.
            </p>
          `:Sn`
            <div class="space-y-3">
              <div
                class="flex flex-wrap items-start sm:items-center justify-between gap-3"
              >
                <h2 class="card-label text-xs">Estimated cost breakdown</h2>
                <div
                  class="inline-flex flex-wrap items-center gap-3 text-xs text-fg-muted"
                >
                  <label
                    class="inline-flex items-center gap-2 text-xs text-fg-muted"
                  >
                    <select
                      class="bg-field border border-border rounded-lg text-xs px-2.5 py-1.5 text-body focus:border-fg-muted"
                      value=${String(l?.agent||"")}
                      onChange=${c=>a(String(c.currentTarget?.value||""))}
                    >
                      ${e.map(c=>Sn`
                          <option value=${String(c.agent||"")}>
                            ${String(c.agent||"unknown")}
                          </option>
                        `)}
                    </select>
                  </label>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                ${k1.map(c=>{let d=(l?.sourceBreakdown||[]).find(u=>String(u.source||"")===c)||{source:c,totalCost:0,totalTokens:0,turnCount:0};return Sn`
                    <div class="ac-surface-inset px-2.5 py-2">
                      <p class="text-[11px] text-fg-muted">
                        ${Cf(d.source)}
                      </p>
                      <p class="text-xs text-body mt-0.5">
                        ${gn(d.totalCost)}
                      </p>
                      <p class="text-[11px] text-fg-muted mt-0.5">
                        ${Jt(d.totalTokens)} tok ·
                        ${Af(d.turnCount,"turn","turns")}
                      </p>
                    </div>
                  `})}
              </div>
            </div>
          `}
      ${n.length?Sn`
            <div class="mt-3">
              <p class="text-[11px] text-fg-muted">
                <span>
                  . Missing model pricing for ${n.length}
                  ${n.length===1?"model":"models"}:
                  ${r}.
                </span>
              </p>
            </div>
          `:null}
    </div>
  `},M1=({summary:t=null,periodSummary:e,metric:n="tokens",breakdown:s="model",days:o=30,overviewCanvasRef:r,onDaysChange:i=()=>{},onMetricChange:a=()=>{},onBreakdownChange:l=()=>{}})=>{let c=vR(t);return Sn`
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <${_f}
          title="Today"
          tokens=${e.today.tokens}
          cost=${e.today.cost}
        />
        <${_f}
          title="Last 7 days"
          tokens=${e.week.tokens}
          cost=${e.week.cost}
        />
        <${_f}
          title="Last 30 days"
          tokens=${e.month.tokens}
          cost=${e.month.cost}
        />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <${Mf}
          title="Cache hit rate"
          value=${xR(c.cacheHitRate)}
          valueClass=${yR(c.cacheHitRate)}
          detail=${`${qa(c.cacheReadTokens)} cached \xB7 ${qa(c.promptTokens)} prompt`}
        />
        <${Mf}
          title="Avg tokens per turn"
          value=${qa(c.avgTokensPerTurn)}
          valueSuffix="tokens"
          detail=${`${Af(c.turnCount,"turn","turns")} last ${o} days`}
        />
        <${Mf}
          title="Avg cost per turn"
          value=${gn(c.avgCostPerTurn)}
          detail=${`${Af(c.turnCount,"turn","turns")} last ${o} days`}
        />
      </div>
      <div class="bg-surface border border-border rounded-xl p-4">
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3"
        >
          <label class="inline-flex items-center gap-2">
            <select
              class="bg-field border border-border rounded-lg text-xs px-2.5 py-1.5 text-body focus:border-fg-muted"
              value=${s}
              onChange=${d=>l(String(d.currentTarget?.value||"model"))}
              aria-label="Usage chart breakdown"
            >
              ${S1.map(d=>Sn`
                  <option value=${d.value}>${d.label}</option>
                `)}
            </select>
          </label>
          <div class="flex items-center gap-2">
            <${Xe}
              options=${y1.map(d=>({label:d.label,value:d.value}))}
              value=${o}
              onChange=${i}
            />
            <${Xe}
              options=${[{label:"tokens",value:"tokens"},{label:"cost",value:"cost"}]}
              value=${n}
              onChange=${a}
            />
          </div>
        </div>
        <div style=${{height:"280px"}}>
          <canvas ref=${r}></canvas>
        </div>
      </div>
      <${$R} summary=${t} />
    </div>
  `};var zt=P.bind(T),A1=(t,e,n)=>{let s=Number(t||0),o=s===1?e:n;return`${Jt(s)} ${o}`},wR=({session:t})=>{let e=t?.labels;if(!Array.isArray(e)||e.length===0){let n=String(t?.sessionKey||t?.sessionId||"");return zt`<span class="truncate">${n}</span>`}return zt`
    <span class="inline-flex items-center gap-1.5 flex-wrap">
      ${e.map(n=>zt`
          <span
            class=${`inline-flex items-center px-1.5 py-0.5 rounded border text-[11px] leading-tight ${$f[n.tone]||$f.gray}`}
          >
            ${n.label}
          </span>
        `)}
    </span>
  `},kR=({item:t,expandedSessionIds:e,loadingDetailById:n,sessionDetailById:s})=>{let o=String(t.sessionId||"");if(!e.includes(o))return null;let i=s[o];if(!!n[o])return zt`
      <div class="ac-history-body">
        <p class="text-xs text-fg-muted">Loading session detail...</p>
      </div>
    `;if(!i)return zt`
      <div class="ac-history-body">
        <p class="text-xs text-fg-muted">Session detail not available.</p>
      </div>
    `;let l=String(i.sessionKey||t.sessionKey||i.sessionId||t.sessionId||"").trim();return zt`
    <div class="ac-history-body space-y-3 border-0 pt-0 mt-0">
      <div>
        <p class="text-[11px] text-fg-muted mb-1">Session key</p>
        <p class="text-xs text-body font-mono break-all">${l||"n/a"}</p>
      </div>
      <div class="mt-1.5">
        <p class="text-[11px] text-fg-muted mb-1">Model breakdown</p>
        ${(i.modelBreakdown||[]).length===0?zt`<p class="text-xs text-fg-muted">No model usage recorded.</p>`:zt`
              <div class="space-y-1.5">
                ${(i.modelBreakdown||[]).map(c=>zt`
                    <div class="flex items-center justify-between gap-3 text-xs px-1 py-0.5 rounded hover:bg-surface transition-colors">
                      <span class="text-body truncate">${c.model||"unknown"}</span>
                      <span class="inline-flex items-center gap-3 text-fg-muted shrink-0">
                        <span>${Jt(c.totalTokens)} tok</span>
                        <span>${gn(c.totalCost)}</span>
                        <span>${A1(c.turnCount,"turn","turns")}</span>
                      </span>
                    </div>
                  `)}
              </div>
            `}
      </div>
      <div>
        <p class="text-[11px] text-fg-muted mb-1">Tool usage</p>
        ${(i.toolUsage||[]).length===0?zt`<p class="text-xs text-fg-muted">No tool calls recorded.</p>`:zt`
              <div class="space-y-1.5">
                ${(i.toolUsage||[]).map(c=>zt`
                    <div class="flex items-center justify-between gap-3 text-xs px-1 py-0.5 rounded hover:bg-surface transition-colors">
                      <span class="text-body truncate">${c.toolName}</span>
                      <span class="inline-flex items-center gap-3 text-fg-muted shrink-0">
                        <span>${A1(c.callCount,"call","calls")}</span>
                        <span>${(Number(c.errorRate||0)*100).toFixed(1)}% err</span>
                        <span>${bn(c.avgDurationMs)}</span>
                      </span>
                    </div>
                  `)}
              </div>
            `}
      </div>
    </div>
  `},T1=({sessions:t=[],loadingSessions:e=!1,expandedSessionIds:n=[],loadingDetailById:s={},sessionDetailById:o={},onToggleSession:r=()=>{}})=>zt`
  <div class="bg-surface border border-border rounded-xl p-4">
    <h2 class="card-label text-xs mb-3">Sessions</h2>
    <div class="ac-history-list">
      ${t.length===0?zt`<p class="text-xs text-fg-muted">
            ${e?"Loading sessions...":"No sessions recorded yet."}
          </p>`:t.map(i=>zt`
              <details
                class="ac-history-item"
                open=${n.includes(String(i.sessionId||""))}
                ontoggle=${a=>{let l=String(i.sessionId||""),c=!!a.currentTarget?.open;r(l,c)}}
              >
                <summary class="ac-history-summary hover:bg-surface transition-colors">
                  <div class="ac-history-summary-row">
                    <span class="inline-flex items-center gap-2 min-w-0">
                      <span class="ac-history-toggle shrink-0" aria-hidden="true">▸</span>
                      <${wR} session=${i} />
                    </span>
                    <span class="inline-flex items-center gap-3 shrink-0 text-xs text-fg-muted">
                      <span>${Jt(i.totalTokens)} tok</span>
                      <span>${gn(i.totalCost)}</span>
                      <span>
                        ${Yn(i.lastActivityMs,{fallback:"n/a",valueIsEpochMs:!0})}
                      </span>
                    </span>
                  </div>
                </summary>
                <${kR}
                  item=${i}
                  expandedSessionIds=${n}
                  loadingDetailById=${s}
                  sessionDetailById=${o}
                />
              </details>
            `)}
    </div>
  </div>
`;var P1=({sessionId:t=""})=>{let[e,n]=y(()=>{let E=Fe(),M=Number.parseInt(String(E[wf]??""),10);return[7,30,90].includes(M)?M:v1}),[s,o]=y(()=>Fe()[kf]==="cost"?"cost":$1),[r,i]=y(()=>{let E=Fe(),M=String(E[Sf]||"").trim();return M==="source"||M==="agent"?M:w1}),[a,l]=y(null),[c,d]=y([]),[u,p]=y({}),[f,g]=y(!1),[m,h]=y(!1),[b,x]=y({}),[v,w]=y(()=>t?[String(t)]:[]),[$,S]=y(""),C=ee(null),_=ee(null),k=q(async()=>{g(!0),S("");try{let E=await am(e);l(E.summary||null)}catch(E){S(E.message||"Could not load usage summary")}finally{g(!1)}},[e]),A=q(async()=>{h(!0);try{let E=await lm(100);d(Array.isArray(E.sessions)?E.sessions:[])}catch(E){S(E.message||"Could not load sessions")}finally{h(!1)}},[]),O=q(async E=>{let M=String(E||"").trim();if(M){x(R=>({...R,[M]:!0}));try{let R=await cm(M);p(B=>({...B,[M]:R.detail||null}))}catch(R){S(R.message||"Could not load session detail")}finally{x(R=>({...R,[M]:!1}))}}},[]);L(()=>{k()},[k]),L(()=>{let E=Fe();E[wf]=e,E[kf]=s,E[Sf]=r,Ct(E)},[e,s,r]),L(()=>{A()},[A]),L(()=>{let E=String(t||"").trim();E&&(w(M=>M.includes(E)?M:[...M,E]),!u[E]&&!b[E]&&O(E))},[t,u,b,O]);let D=F(()=>{let E=Array.isArray(a?.daily)?a.daily:[],M=new Date,R=Pc(M),B=Pc(new Date(M.getTime()-10080*60*1e3)),I=Pc(new Date(M.getTime()-720*60*60*1e3)),U={tokens:0,cost:0};return E.reduce((W,G)=>{let se=Number(G.totalTokens||0),K=Number(G.totalCost||0);return String(G.date)===R&&(W.today.tokens+=se,W.today.cost+=K),String(G.date)>=B&&(W.week.tokens+=se,W.week.cost+=K),String(G.date)>=I&&(W.month.tokens+=se,W.month.cost+=K),W},{today:{...U},week:{...U},month:{...U}})},[a]),z=F(()=>{let E=Array.isArray(a?.daily)?a.daily:[],M=new Set,R=new Map,B=r==="source"?"sources":r==="agent"?"agents":"models",I=r==="source"?"source":r==="agent"?"agent":"model";for(let se of E)for(let K of se[B]||[]){let j=String(K[I]||"unknown");M.add(j),R.set(j,Number(R.get(j)||0)+Number(s==="cost"?K.totalCost||0:K.totalTokens||0))}let U=E.map(se=>Xn(String(se.date||""),{range:e<=7?"7d":"30d",valueType:"day-key"})),G=Array.from(M).sort((se,K)=>{let j=Number(R.get(se)||0),X=Number(R.get(K)||0);return X!==j?X-j:se.localeCompare(K)}).map(se=>({label:se,data:E.map(K=>{let j=(K[B]||[]).find(X=>String(X[I]||"")===se);return j?Number(s==="cost"?j.totalCost||0:j.totalTokens||0):0}),backgroundColor:C1(`${r}:${se}`)}));return{labels:U,datasets:G}},[a,s,r,e]);return L(()=>{let E=C.current;if(!(!E||!ls))return _.current&&(_.current.destroy(),_.current=null),_.current=new ls(E,{type:"bar",data:z,options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},scales:{x:{stacked:!0,ticks:{color:"rgba(156,163,175,1)"}},y:{stacked:!0,ticks:{color:"rgba(156,163,175,1)",callback:M=>s==="cost"?`$${Number(M).toFixed(2)}`:Jt(M)}}},plugins:{legend:{labels:{color:"rgba(209,213,219,1)",boxWidth:10,boxHeight:10}},tooltip:{callbacks:{label:M=>{let R=Number(M.parsed.y||0),B=_1(M.dataset.label,r);return s==="cost"?`${B}: ${gn(R)}`:`${B}: ${Jt(R)} tokens`}}}}}}),()=>{_.current&&(_.current.destroy(),_.current=null)}},[z,s,r]),{state:{days:e,metric:s,breakdown:r,summary:a,sessions:c,sessionDetailById:u,loadingSummary:f,loadingSessions:m,loadingDetailById:b,expandedSessionIds:v,error:$,periodSummary:D,overviewCanvasRef:C},actions:{setDays:n,setMetric:o,setBreakdown:i,loadSummary:k,loadSessionDetail:O,setExpandedSessionIds:w}}};var qi=P.bind(T),R1=({sessionId:t=""})=>{let{state:e,actions:n}=P1({sessionId:t}),s=(o,r)=>{if(r){n.setExpandedSessionIds(i=>i.includes(o)?i:[...i,o]),!e.sessionDetailById[o]&&!e.loadingDetailById[o]&&n.loadSessionDetail(o);return}n.setExpandedSessionIds(i=>i.filter(a=>a!==o))};return qi`
    <div class="space-y-4">
      <${Ne}
        title="Usage"
        actions=${qi`
          <${Z}
            onClick=${n.loadSummary}
            loading=${e.loadingSummary}
            tone="secondary"
            size="sm"
            idleLabel="Refresh"
            loadingMode="inline"
          />
        `}
      />
      ${e.error?qi`<div class="text-xs text-status-error bg-status-error-bg border border-status-error-border rounded px-3 py-2">
            ${e.error}
          </div>`:null}
      ${e.loadingSummary&&!e.summary?qi`<div class="text-sm text-[var(--text-muted)]">Loading usage summary...</div>`:qi`
            <${M1}
              summary=${e.summary}
              periodSummary=${e.periodSummary}
              metric=${e.metric}
              breakdown=${e.breakdown}
              days=${e.days}
              overviewCanvasRef=${e.overviewCanvasRef}
              onDaysChange=${n.setDays}
              onMetricChange=${n.setMetric}
              onBreakdownChange=${n.setBreakdown}
            />
          `}
      <${T1}
        sessions=${e.sessions}
        loadingSessions=${e.loadingSessions}
        expandedSessionIds=${e.expandedSessionIds}
        loadingDetailById=${e.loadingDetailById}
        sessionDetailById=${e.sessionDetailById}
        onToggleSession=${s}
      />
    </div>
  `};var SR=P.bind(T),Rc=({sessionId:t="",onSetLocation:e=()=>{}})=>SR`
  <div class="pt-4">
    <${R1}
      sessionId=${t}
      onSelectSession=${n=>e(`/usage/${encodeURIComponent(String(n||""))}`)}
      onBackToSessions=${()=>e("/usage")}
    />
  </div>
`;var Un="logs",Cn="terminal",Pf="watchdogConsoleTab",Rf="watchdogLogsPanelHeightPx";var CR="/css/vendor/xterm.css",L1="/api/watchdog/terminal/ws",Tf=null,E1=()=>(Tf||(Tf=Promise.all([import("./chunks/xterm-DK3X7FZB.js"),import("./chunks/addon-fit-4LH2IIZ4.js")])),Tf),I1=()=>{if(typeof document>"u"||document.getElementById("ac-xterm-css"))return;let t=document.createElement("link");t.id="ac-xterm-css",t.rel="stylesheet",t.href=CR,document.head.appendChild(t)},Ji=({panel:t=null,fitAddon:e=null,minWidthPx:n=120,minHeightPx:s=80}={})=>{if(!t||!e)return!1;let o=Number(t.clientWidth||0),r=Number(t.clientHeight||0);return o<n||r<s?!1:(e.fit(),!0)},Lc=t=>t===Cn?Cn:Un,Lf=t=>{let e=Number(t),n=Number.isFinite(e)?Math.round(e):320;return Math.max(160,n)},D1=t=>{if(!t)return 0;let e=Number.parseFloat(window.getComputedStyle(t).height||"0");return Number.isFinite(e)?e:0},Kn=t=>t==null?"\u2014":t<1024?`${t} B`:t<1024*1024?`${(t/1024).toFixed(0)} KB`:t<1024*1024*1024?`${(t/(1024*1024)).toFixed(0)} MB`:`${(t/(1024*1024*1024)).toFixed(1)} GB`,N1=t=>{let e=String(t?.eventType||"").trim().toLowerCase(),n=String(t?.status||"").trim().toLowerCase();return n==="failed"?{dotClass:"bg-red-500/90",label:"Failed"}:n==="ok"&&e==="health_check"?{dotClass:"bg-green-500/90",label:"Healthy"}:n==="warn"||n==="warning"?{dotClass:"bg-yellow-400/90",label:"Warning"}:{dotClass:"bg-gray-500/70",label:"Unknown"}};var O1=({active:t=!1,panelRef:e=null,hostRef:n=null}={})=>{let[s,o]=y(!1),[r,i]=y(!1),[a,l]=y(!1),[c,d]=y(""),[u,p]=y(!1),[f,g]=y(""),[m,h]=y(0),b=ee(null),x=ee(null),v=ee(null),w=ee("");return L(()=>{w.current=String(f||"")},[f]),L(()=>{if(!t)return;let k=!1,A=null;(async()=>{try{o(!0),I1();let[{Terminal:z},{FitAddon:E}]=await E1();if(k)return;if(!b.current&&n?.current){let I=new z({cursorBlink:!0,fontFamily:"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",fontSize:12,lineHeight:1.2,letterSpacing:0,convertEol:!1,theme:{background:"rgba(0, 0, 0, 0)",foreground:"#d1d5db",cursor:"#67e8f9"}}),U=new E;I.loadAddon(U),I.open(n.current),U.fit(),I.attachCustomKeyEventHandler(W=>{if(W.type!=="keydown")return!0;let G=String(W.key||"").toLowerCase();return!W.metaKey||W.ctrlKey||W.altKey||W.shiftKey||G!=="k"?!0:(W.preventDefault(),I.clear(),!1)}),window.setTimeout(()=>{x.current?.fit()},120),I.focus(),I.onData(W=>{let G=v.current;!G||G.readyState!==1||G.send(JSON.stringify({type:"input",data:W}))}),b.current=I,x.current=U}let M=v.current;if(M&&M.readyState<=1){o(!1),p(!1),Ji({panel:e?.current,fitAddon:x.current}),b.current?.focus();return}let R=window.location.protocol==="https:"?"wss":"ws",B=new WebSocket(`${R}://${window.location.host}${L1}`);v.current=B,B.onopen=()=>{k||(o(!1),p(!1),i(!0),l(!1),d("Connected"),Ji({panel:e?.current,fitAddon:x.current}),b.current?.focus())},B.onmessage=I=>{let U=null;try{U=JSON.parse(String(I.data||""))}catch{return}let W=String(U?.type||"");if(W==="session"){let G=String(U?.session?.id||"");G&&g(G),d("Connected");return}if(W==="output"){b.current?.write(String(U?.data||""));return}W==="exit"&&(l(!0),i(!1),d("Session ended"))},B.onclose=()=>{k||(o(!1),p(!1),i(!1),a||d("Disconnected"))},B.onerror=()=>{k||(o(!1),p(!1),i(!1),d("Connection error"),N("Watchdog terminal connection failed","error"))}}catch{if(k)return;o(!1),p(!1),i(!1),d("Terminal failed to load"),N("Could not initialize terminal","error")}})();let D=()=>{A&&window.clearTimeout(A),A=window.setTimeout(()=>{Ji({panel:e?.current,fitAddon:x.current})},60)};return window.addEventListener("resize",D),()=>{k=!0,A&&window.clearTimeout(A),window.removeEventListener("resize",D)}},[t,a,m,e,n]),L(()=>()=>{let k=String(w.current||"");k&&ad(k).catch(()=>{});let A=v.current;A&&A.readyState<=1&&A.close(),v.current=null,x.current=null,b.current&&b.current.dispose(),b.current=null},[]),{connectingTerminal:s,terminalConnected:r,terminalEnded:a,terminalStatusText:c,terminalUiSettling:u,terminalInstanceRef:b,fitNow:()=>{Ji({panel:e?.current,fitAddon:x.current})},prepareForActivate:()=>{if(!!v.current&&v.current.readyState<=1&&r){p(!1),o(!1);return}p(!0),o(!0)},clearSettling:()=>{p(!1)},restartSession:()=>{let k=String(f||"");k&&ad(k).catch(()=>{});let A=v.current;A&&A.readyState<=1&&A.close(),v.current=null,b.current?.clear(),o(!0),p(!0),l(!1),i(!1),g(""),d("Connecting..."),h(O=>O+1)}}};var B1=()=>{let[t,e]=y(""),[n,s]=y(!0),[o,r]=y(!0),[i,a]=y(()=>{let h=Fe();return Lc(h?.[Pf])}),[l,c]=y(()=>{let h=Fe();return Lf(h?.[Rf])}),d=ee(null),u=ee(null),p=ee(null),f=O1({active:i===Cn,panelRef:u,hostRef:p});return L(()=>{let h=Fe();h[Pf]=Lc(i),Ct(h)},[i]),L(()=>{let h=!0,b=null,x=async()=>{try{let v=await um(65536);if(!h)return;e(v||""),s(!1)}catch{if(!h)return;s(!1)}h&&(b=setTimeout(x,3e3))};return x(),()=>{h=!1,b&&clearTimeout(b)}},[]),L(()=>{let h=d.current;!h||!o||(h.scrollTop=h.scrollHeight)},[t,o]),L(()=>{let h=i===Un?d.current:u.current;if(!h||typeof ResizeObserver>"u")return()=>{};let b=null,x=new ResizeObserver(v=>{let w=v?.[0],$=Lf(D1(w?.target));c(S=>Math.abs(S-$)>=1?$:S),b&&window.clearTimeout(b),b=window.setTimeout(()=>{let S=Fe();S[Rf]=$,Ct(S)},120),i===Cn&&window.requestAnimationFrame(()=>{f.fitNow()})});return x.observe(h),()=>{x.disconnect(),b&&window.clearTimeout(b)}},[i]),{logs:t,loadingLogs:n,stickToBottom:o,setStickToBottom:r,activeConsoleTab:i,handleSelectConsoleTab:(h=Un)=>{let b=Lc(h);b===Cn?f.prepareForActivate():f.clearSettling(),a(b)},logsPanelHeightPx:l,logsRef:d,terminalPanelRef:u,terminalHostRef:p,onRestartTerminalSession:()=>{f.restartSession(),a(Cn)},...f}};var F1=({restartSignal:t=0,onRefreshStatuses:e=()=>{}}={})=>{let n=Re(()=>dm(20),15e3);return L(()=>{if(!t)return;e(),n.refresh();let s=setTimeout(()=>{e(),n.refresh()},1200),o=setTimeout(()=>{e(),n.refresh()},3500);return()=>{clearTimeout(s),clearTimeout(o)}},[t,e,n.refresh]),{events:n.data?.events||[],refreshEvents:n.refresh}};var H1=()=>{let t=Re(()=>pm(),5e3),[e,n]=y(!1);return{resources:t.data?.resources||null,memoryExpanded:e,setMemoryExpanded:n}};var W1=({watchdogStatus:t=null,onRefreshStatuses:e=()=>{},onRefreshIncidents:n=()=>{}}={})=>{let[s,o]=y({autoRepair:!1,notificationsEnabled:!0}),[r,i]=y(!1),[a,l]=y(!1),c=a||!!(t||{})?.operationInProgress;return L(()=>{let f=!0;return(async()=>{try{let m=await fm();if(!f)return;o(m.settings||{autoRepair:!1,notificationsEnabled:!0})}catch(m){if(!f)return;N(m.message||"Could not load watchdog settings","error")}})(),()=>{f=!1}},[]),{settings:s,savingSettings:r,isRepairInProgress:c,onToggleAutoRepair:async f=>{if(!r){i(!0);try{let g=await ld({autoRepair:!!f});o(g.settings||{...s,autoRepair:!!f}),e(),N(`Auto-repair ${f?"enabled":"disabled"}`,"success")}catch(g){N(g.message||"Could not update auto-repair","error")}finally{i(!1)}}},onToggleNotifications:async f=>{if(!r){i(!0);try{let g=await ld({notificationsEnabled:!!f});o(g.settings||{...s,notificationsEnabled:!!f}),e(),N(`Notifications ${f?"enabled":"disabled"}`,"success")}catch(g){N(g.message||"Could not update notifications","error")}finally{i(!1)}}},onRepair:async()=>{if(!c){l(!0);try{let f=await ha();if(!f.ok)throw new Error(f.error||"Repair failed");N("Repair triggered","success"),setTimeout(()=>{e(),n()},800)}catch(f){N(f.message||"Could not run repair","error")}finally{l(!1)}}}}};var V1=({watchdogStatus:t=null,onRefreshStatuses:e=()=>{},restartSignal:n=0}={})=>{let s=t||{},o=F1({restartSignal:n,onRefreshStatuses:e}),r=H1(),i=W1({watchdogStatus:s,onRefreshStatuses:e,onRefreshIncidents:o.refreshEvents}),a=B1();return{currentWatchdogStatus:s,events:o.events,refreshEvents:o.refreshEvents,resources:r.resources,memoryExpanded:r.memoryExpanded,setMemoryExpanded:r.setMemoryExpanded,settings:i.settings,savingSettings:i.savingSettings,onToggleAutoRepair:i.onToggleAutoRepair,onToggleNotifications:i.onToggleNotifications,onRepair:i.onRepair,isRepairInProgress:i.isRepairInProgress,logs:a.logs,loadingLogs:a.loadingLogs,stickToBottom:a.stickToBottom,setStickToBottom:a.setStickToBottom,activeConsoleTab:a.activeConsoleTab,handleSelectConsoleTab:a.handleSelectConsoleTab,connectingTerminal:a.connectingTerminal,terminalConnected:a.terminalConnected,terminalEnded:a.terminalEnded,terminalStatusText:a.terminalStatusText,terminalUiSettling:a.terminalUiSettling,onRestartTerminalSession:a.onRestartTerminalSession,logsPanelHeightPx:a.logsPanelHeightPx,logsRef:a.logsRef,terminalPanelRef:a.terminalPanelRef,terminalHostRef:a.terminalHostRef,terminalInstanceRef:a.terminalInstanceRef}};var Ec=P.bind(T),_R=t=>t==null?"bg-gray-600":"bg-cyan-400",Zi=({label:t,percent:e,detail:n,segments:s=null,expanded:o=!1,onToggle:r=null})=>Ec`
  <div
    class=${r?"cursor-pointer group":""}
    onclick=${r||void 0}
  >
    <span
      class=${`text-xs text-fg-muted ${r?"group-hover:text-body transition-colors":""}`}
      >${t}</span
    >
    <div
      class=${`h-0.5 w-full bg-white/15 rounded-full overflow-hidden mt-1.5 flex ${r?"group-hover:bg-white/10 transition-colors":""}`}
    >
      ${o&&s?s.map(i=>Ec`
              <div
                class="h-full"
                style=${{width:`${Math.min(100,i.percent??0)}%`,backgroundColor:i.color,transition:"width 0.8s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s ease"}}
              ></div>
            `):Ec`
            <div
              class=${`h-full rounded-full ${_R(e)}`}
              style=${{width:`${Math.min(100,e??0)}%`,transition:"width 0.8s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s ease"}}
            ></div>
          `}
    </div>
    <div class="flex flex-wrap items-center gap-x-3 mt-2.5">
      <span class="text-xs text-fg-muted font-mono flex-1">${n}</span>
      ${o&&s&&s.filter(i=>i.label).map(i=>Ec`
            <span
              class="inline-flex items-center gap-1 text-xs text-fg-muted font-mono"
            >
              <span
                class="inline-block w-1.5 h-1.5 rounded-full"
                style=${{backgroundColor:i.color}}
              ></span>
              ${i.label}
            </span>
          `)}
    </div>
  </div>
`;var Ic=P.bind(T),j1=({resources:t=null,memoryExpanded:e=!1,onSetMemoryExpanded:n=()=>{}})=>{if(!t)return null;let s=t.disk?.path?Ic`
        <${yt}
          text=${t.disk.path}
          widthClass="w-auto max-w-80 whitespace-normal break-all"
        >
          <span class="inline-block cursor-help">Disk</span>
        </${yt}>
      `:"Disk",o=(()=>{let r=t.processes,i=t.memory?.totalBytes,a=t.memory?.usedBytes;if(!r||!i||!a)return null;let l=[],c=0;r.gateway?.rssBytes!=null&&(c+=r.gateway.rssBytes,l.push({percent:r.gateway.rssBytes/i*100,color:"#22d3ee",label:`Gateway ${Kn(r.gateway.rssBytes)}`})),r.alphaclaw?.rssBytes!=null&&(c+=r.alphaclaw.rssBytes,l.push({percent:r.alphaclaw.rssBytes/i*100,color:"#a78bfa",label:`AlphaClaw ${Kn(r.alphaclaw.rssBytes)}`}));let d=Math.max(0,a-c);return d>0&&l.push({percent:d/i*100,color:"#4b5563",label:`Other ${Kn(d)}`}),l.length?l:null})();return Ic`
    <div class="bg-surface border border-border rounded-xl p-4">
      ${e?Ic`
            <${Zi}
              label="Memory"
              detail=${`${Kn(t.memory?.usedBytes)} / ${Kn(t.memory?.totalBytes)}`}
              percent=${t.memory?.percent}
              expanded=${!0}
              onToggle=${()=>n(!1)}
              segments=${o}
            />
          `:Ic`
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <${Zi}
                label="Memory"
                percent=${t.memory?.percent}
                detail=${`${Kn(t.memory?.usedBytes)} / ${Kn(t.memory?.totalBytes)}`}
                onToggle=${()=>n(!0)}
              />
              <${Zi}
                label=${s}
                percent=${t.disk?.percent}
                detail=${`${Kn(t.disk?.usedBytes)} / ${Kn(t.disk?.totalBytes)}`}
              />
              <${Zi}
                label=${`CPU${t.cpu?.cores?` (${t.cpu.cores} vCPU)`:""}`}
                percent=${t.cpu?.percent}
                detail=${t.cpu?.percent!=null?`${t.cpu.percent}%`:"\u2014"}
              />
            </div>
          `}
    </div>
  `};var Ef=P.bind(T),z1=({settings:t={},savingSettings:e=!1,onToggleAutoRepair:n=()=>{},onToggleNotifications:s=()=>{}})=>{let[o,r]=y(!1),[i,a]=y(null),l=async()=>{r(!0),a(null);try{let u=await(await fetch("/api/watchdog/test-notification",{method:"POST"})).json();if(!u?.ok){a(u);return}let p=u.result?.channels||u.result||{},f=[];for(let m of["telegram","discord","slack"]){let h=p[m];!h||h.skipped||(h.sent>0&&f.push(`${m}: ${h.sent} sent`),h.failed>0&&f.push(`${m}: ${h.failed} failed`))}if(f.length===0){N("No channels configured","warning");return}let g=f.some(m=>m.includes("failed"));N(g?f.join(", "):`Test notification sent: ${f.join(", ")}`,g?"warning":"success")}catch(d){a({ok:!1,error:d.message})}finally{r(!1)}},c=d=>d?Ef`<span class="text-status-error-muted text-xs">
      ${d.error||"Failed"}
    </span>`:null;return Ef`
    <div class="bg-surface border border-border rounded-xl p-4">
      <div class="flex items-center justify-between gap-3">
        <div class="inline-flex items-center gap-2 text-xs text-fg-muted">
          <span>Auto-repair</span>
          <${no}
            text="Automatically runs OpenClaw doctor repair when watchdog detects gateway health failures or crash loops."
          />
        </div>
        <${vn}
          checked=${!!t.autoRepair}
          disabled=${e}
          onChange=${n}
          label=""
        />
      </div>
      <div class="flex items-center justify-between gap-3 mt-3">
        <div class="inline-flex items-center gap-2 text-xs text-fg-muted">
          <span>Notifications</span>
          <${no}
            text="Sends channel notices for watchdog alerts and auto-repair outcomes."
          />
        </div>
        <div class="flex items-center gap-2">
          <button
            class=${`text-xs px-2 py-1 rounded-lg ac-btn-ghost disabled:opacity-50 disabled:cursor-not-allowed ${t.notificationsEnabled?"":"invisible pointer-events-none"}`}
            onClick=${l}
            disabled=${o||e||!t.notificationsEnabled}
            aria-hidden=${!t.notificationsEnabled}
            tabIndex=${t.notificationsEnabled?0:-1}
          >
            ${o?"Sending...":"Test"}
          </button>
          <${vn}
            checked=${!!t.notificationsEnabled}
            disabled=${e}
            onChange=${s}
            label=""
          />
        </div>
      </div>
      ${i?Ef`<div class="mt-2">${c(i)}</div>`:null}
    </div>
  `};var MR=P.bind(T),U1=({panelRef:t=null,hostRef:e=null,terminalInstanceRef:n=null,panelHeightPx:s=320})=>MR`
  <div
    ref=${t}
    class="watchdog-logs-panel bg-field border border-border rounded-lg p-3 overflow-hidden"
    style=${{height:`${s}px`}}
    onClick=${()=>n?.current?.focus()}
  >
    <div ref=${e} class="watchdog-terminal-host w-full h-full"></div>
  </div>
`;var Yi=P.bind(T),K1=({activeConsoleTab:t=Un,stickToBottom:e=!0,onSetStickToBottom:n=()=>{},onSelectConsoleTab:s=()=>{},connectingTerminal:o=!1,terminalConnected:r=!1,terminalEnded:i=!1,terminalStatusText:a="",terminalUiSettling:l=!1,onRestartTerminalSession:c=()=>{},logsRef:d=null,logs:u="",loadingLogs:p=!0,terminalPanelRef:f=null,terminalHostRef:g=null,terminalInstanceRef:m=null,logsPanelHeightPx:h=320})=>Yi`
  <div class="bg-surface border border-border rounded-xl p-4">
    <div class="flex items-center justify-between gap-2 mb-3">
      <div
        class="inline-flex items-center rounded-lg border border-border bg-field p-0.5"
      >
        <button
          type="button"
          class=${`px-2.5 py-1 text-xs rounded-md ${t===Un?"bg-surface text-bright":"text-fg-muted hover:text-body"}`}
          onClick=${()=>s(Un)}
        >
          Logs
        </button>
        <button
          type="button"
          class=${`px-2.5 py-1 text-xs rounded-md ${t===Cn?"bg-surface text-bright":"text-fg-muted hover:text-body"}`}
          onClick=${()=>s(Cn)}
        >
          Terminal
        </button>
      </div>
      <div class="flex items-center gap-2">
        ${t===Un?Yi`
              <label class="inline-flex items-center gap-2 text-xs text-fg-muted">
                <input
                  type="checkbox"
                  checked=${e}
                  onchange=${b=>n(!!b.currentTarget?.checked)}
                />
                Stick to bottom
              </label>
            `:Yi`
              <div class="flex items-center gap-2 pr-1">
                ${l?null:Yi`
                      <span class="text-xs text-fg-muted">
                        ${o?"Connecting...":i?"Session ended":r?"Connected":a||"Disconnected"}
                      </span>
                      ${o||r?null:Yi`
                            <button
                              type="button"
                              class="ac-btn-secondary text-xs px-2.5 py-1 rounded-lg"
                              onClick=${c}
                            >
                              New session
                            </button>
                          `}
                    `}
              </div>
            `}
      </div>
    </div>
    <div class=${t===Un?"":"hidden"}>
      <pre
        ref=${d}
        class="watchdog-logs-panel bg-field border border-border rounded-lg p-3 overflow-auto text-xs text-body whitespace-pre-wrap break-words"
        style=${{height:`${h}px`}}
      >
${p?"Loading logs...":u||"No logs yet."}</pre
      >
    </div>
    <div
      class=${t===Cn?"space-y-2":"hidden"}
    >
      <${U1}
        panelRef=${f}
        hostRef=${g}
        terminalInstanceRef=${m}
        panelHeightPx=${h}
      />
    </div>
  </div>
`;var If=P.bind(T),G1=({events:t=[],onRefresh:e=()=>{}})=>If`
  <div class="bg-surface border border-border rounded-xl p-4">
    <div class="flex items-center justify-between gap-2 mb-3">
      <h2 class="card-label">Recent incidents</h2>
      <button class="text-xs text-fg-muted hover:text-body" onclick=${e}>
        Refresh
      </button>
    </div>
    <div class="ac-history-list">
      ${t.length===0&&If`<p class="text-xs text-fg-muted">No incidents recorded.</p>`}
      ${t.map(n=>{let s=N1(n);return If`
          <details class="ac-history-item">
            <summary class="ac-history-summary">
              <div class="ac-history-summary-row">
                <span class="inline-flex items-center gap-2 min-w-0">
                  <span class="ac-history-toggle shrink-0" aria-hidden="true"
                    >▸</span
                  >
                  <span class="truncate">
                    ${n.createdAt||""} · ${n.eventType||"event"} ·
                    ${n.status||"unknown"}
                  </span>
                </span>
                <span
                  class=${`h-2.5 w-2.5 shrink-0 rounded-full ${s.dotClass}`}
                  title=${s.label}
                  aria-label=${s.label}
                ></span>
              </div>
            </summary>
            <div class="ac-history-body text-xs text-fg-muted">
              <div>Source: ${n.source||"unknown"}</div>
              <pre class="mt-2 bg-field rounded p-2 whitespace-pre-wrap break-words">
${typeof n.details=="string"?n.details:JSON.stringify(n.details||{},null,2)}</pre
              >
            </div>
          </details>
        `})}
    </div>
  </div>
`;var AR=P.bind(T),q1=({gatewayStatus:t=null,openclawVersion:e=null,watchdogStatus:n=null,onRefreshStatuses:s=()=>{},restartingGateway:o=!1,onRestartGateway:r,restartSignal:i=0,openclawUpdateInProgress:a=!1,onOpenclawVersionActionComplete:l=()=>{},onOpenclawUpdate:c})=>{let d=V1({watchdogStatus:n,onRefreshStatuses:s,restartSignal:i});return AR`
    <div class="space-y-4">
      <${bc}
        status=${t}
        openclawVersion=${e}
        restarting=${o}
        onRestart=${r}
        watchdogStatus=${d.currentWatchdogStatus}
        onRepair=${d.onRepair}
        repairing=${d.isRepairInProgress}
        openclawUpdateInProgress=${a}
        onOpenclawVersionActionComplete=${l}
        onOpenclawUpdate=${c}
      />

      <${j1}
        resources=${d.resources}
        memoryExpanded=${d.memoryExpanded}
        onSetMemoryExpanded=${d.setMemoryExpanded}
      />

      <${z1}
        settings=${d.settings}
        savingSettings=${d.savingSettings}
        onToggleAutoRepair=${d.onToggleAutoRepair}
        onToggleNotifications=${d.onToggleNotifications}
      />

      <${K1}
        activeConsoleTab=${d.activeConsoleTab}
        stickToBottom=${d.stickToBottom}
        onSetStickToBottom=${d.setStickToBottom}
        onSelectConsoleTab=${d.handleSelectConsoleTab}
        connectingTerminal=${d.connectingTerminal}
        terminalConnected=${d.terminalConnected}
        terminalEnded=${d.terminalEnded}
        terminalStatusText=${d.terminalStatusText}
        terminalUiSettling=${d.terminalUiSettling}
        onRestartTerminalSession=${d.onRestartTerminalSession}
        logsRef=${d.logsRef}
        logs=${d.logs}
        loadingLogs=${d.loadingLogs}
        terminalPanelRef=${d.terminalPanelRef}
        terminalHostRef=${d.terminalHostRef}
        terminalInstanceRef=${d.terminalInstanceRef}
        logsPanelHeightPx=${d.logsPanelHeightPx}
      />

      <${G1}
        events=${d.events}
        onRefresh=${d.refreshEvents}
      />
    </div>
  `};var TR=P.bind(T),Df=({statusData:t=null,watchdogStatus:e=null,onRefreshStatuses:n=()=>{},restartingGateway:s=!1,onRestartGateway:o=()=>{},restartSignal:r=0,openclawUpdateInProgress:i=!1,onOpenclawVersionActionComplete:a=()=>{},onOpenclawUpdate:l=()=>{}})=>TR`
  <div class="pt-4">
    <${q1}
      gatewayStatus=${t?.gateway||null}
      openclawVersion=${t?.openclawVersion||null}
      watchdogStatus=${e}
      onRefreshStatuses=${n}
      restartingGateway=${s}
      onRestartGateway=${o}
      restartSignal=${r}
      openclawUpdateInProgress=${i}
      onOpenclawVersionActionComplete=${a}
      onOpenclawUpdate=${l}
    />
  </div>
`;var Nf=P.bind(T),J1=({visible:t,name:e,mode:n="webhook",onModeChange:s=()=>{},onNameChange:o=()=>{},canCreate:r=!1,creating:i=!1,onCreate:a=()=>{},onClose:l=()=>{}})=>{let{sessions:c,loading:d,error:u,destinationSessionKey:p,setDestinationSessionKey:f,selectedDestination:g}=Ds({enabled:t,resetKey:String(t)}),h=String(e||"").trim().toLowerCase()||"{name}",b=`/hooks/${h}`,x=n==="oauth"?`${window.location.origin}/oauth/{id}`:`${window.location.origin}${b}`;return t?Nf`
    <${De}
      visible=${t}
      onClose=${l}
      panelClassName="bg-modal border border-border rounded-xl p-5 max-w-lg w-full space-y-4"
    >
      <${Ne}
        title="Create Webhook"
        actions=${Nf`
          <button
            type="button"
            onclick=${l}
            class="h-8 w-8 inline-flex items-center justify-center rounded-lg ac-btn-secondary"
            aria-label="Close modal"
          >
            <${nt} className="w-3.5 h-3.5 text-body" />
          </button>
        `}
      />
      <div class="space-y-2">
        <p class="text-xs text-fg-muted">Endpoint mode</p>
        <div class="flex items-center gap-2">
          <button
            class="text-xs px-2 py-1 rounded border transition-colors ${n==="webhook"?"border-cyan-400 text-status-info bg-cyan-400/10":"border-border text-fg-muted hover:text-body"}"
            onclick=${()=>s("webhook")}
          >
            Webhook
          </button>
          <button
            class="text-xs px-2 py-1 rounded border transition-colors ${n==="oauth"?"border-cyan-400 text-status-info bg-cyan-400/10":"border-border text-fg-muted hover:text-body"}"
            onclick=${()=>s("oauth")}
          >
            OAuth Callback
          </button>
        </div>
      </div>
      <div class="space-y-2">
        <p class="text-xs text-fg-muted">Name</p>
        <input
          type="text"
          value=${e}
          placeholder="fathom"
          onInput=${v=>o(v.target.value)}
          onKeyDown=${v=>{v.key==="Enter"&&r&&!i&&a(g,n),v.key==="Escape"&&l()}}
          class="w-full bg-field border border-border rounded-lg px-3 py-1.5 text-sm text-body outline-none focus:border-fg-muted font-mono"
        />
      </div>
      <${vr}
        label="Deliver to"
        sessions=${c}
        selectedSessionKey=${p}
        onChangeSessionKey=${f}
        disabled=${d||i}
        loading=${d}
        error=${u}
        allowNone=${!0}
        noneValue=${Is}
        noneLabel="Default"
        emptyStateText="No paired chat sessions found yet. You can still create the webhook without a default destination."
        loadingLabel="Loading destinations..."
      />
      <div class="border border-border rounded-lg overflow-hidden">
        <table class="w-full text-xs">
          <tbody>
            <tr class="border-b border-border">
              <td class="w-24 px-3 py-2 text-fg-muted">Path</td>
              <td class="px-3 py-2 text-body font-mono">
                <code>${b}</code>
              </td>
            </tr>
            <tr class="border-b border-border">
              <td class="w-24 px-3 py-2 text-fg-muted">URL</td>
              <td class="px-3 py-2 text-body font-mono break-all">
                <code>${x}</code>
              </td>
            </tr>
            <tr>
              <td class="w-24 px-3 py-2 text-fg-muted">Transform</td>
              <td class="px-3 py-2 text-body font-mono">
                <code>hooks/transforms/${h}/${h}-transform.mjs</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      ${n==="oauth"?Nf`
            <div class="space-y-1">
              <p class="text-xs text-fg-muted">
                For OAuth providers that can't send auth headers. AlphaClaw
                injects webhook auth before forwarding to /hooks/{name}.
              </p>
            </div>
          `:null}
      <div class="pt-1 flex items-center justify-end gap-2">
        <${Z}
          onClick=${l}
          tone="secondary"
          size="md"
          idleLabel="Cancel"
          className="px-4 py-2 rounded-lg text-sm"
        />
        <${Z}
          onClick=${()=>a(g,n)}
          disabled=${!r||i}
          loading=${i}
          tone="primary"
          size="md"
          idleLabel="Create"
          loadingLabel="Creating..."
          className="px-4 py-2 rounded-lg text-sm"
        />
      </div>
    </${De}>
  `:null};var Of=/^[a-z0-9]+(?:-[a-z0-9]+)*$/,Z1=["all","success","error"],Y1=t=>Wo(t,{fallback:"\u2014"}),Dc=t=>Yn(t,{fallback:"\u2014"}),X1=t=>{let e=Number(t||0);return!Number.isFinite(e)||e<=0?"0B":e<1024?`${e}B`:e<1024*1024?`${(e/1024).toFixed(1)}KB`:`${(e/(1024*1024)).toFixed(1)}MB`},Q1=t=>t==="red"?"bg-red-500":t==="yellow"?"bg-yellow-500":"bg-green-500",ek=t=>t==="success"?{dotClass:"bg-green-500/90",textClass:"text-status-success-muted/90"}:t==="error"?{dotClass:"bg-red-500/90",textClass:"text-status-error-muted"}:{dotClass:"bg-gray-500/70",textClass:"text-fg-muted"},Bf=(t="")=>String(t||"").trim().split(/[-_\s]+/).filter(Boolean).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")||"Main Agent",Os=t=>{if(typeof t=="string")try{let e=JSON.parse(t);return JSON.stringify(e,null,2)}catch{return t}try{return JSON.stringify(t||{},null,2)}catch{return String(t||"")}},tk=({hookName:t="",webhook:e=null,request:n=null})=>{let s=String(e?.path||"").trim()||(t?`/hooks/${t}`:"/hooks/unknown"),o=n?.gatewayStatus==null?"n/a":String(n.gatewayStatus);return["Investigate this failed webhook request and share findings before fixing anything.","Reply with your diagnosis first, including the likely root cause, any relevant risks, and what you would change if I approve a fix.","",`Webhook: ${s}`,`Request ID: ${String(n?.id||"unknown")}`,`Time: ${String(n?.createdAt||"unknown")}`,`Method: ${String(n?.method||"unknown")}`,`Source IP: ${String(n?.sourceIp||"unknown")}`,`Gateway status: ${o}`,`Transform path: ${String(e?.transformPath||"unknown")}`,`Payload truncated: ${n?.payloadTruncated?"yes":"no"}`,"","Headers:",Os(n?.headers),"","Payload:",Os(n?.payload),"","Gateway response:",Os(n?.gatewayBody)].join(`
`)};var nk=({selectedHookName:t="",effectiveAuthMode:e="headers",webhookUrl:n="",webhookUrlWithQueryToken:s="",bearerTokenValue:o="",refreshNonce:r=0})=>{let[i,a]=y("all"),[l,c]=y(()=>new Set),[d,u]=y(null),[p,f]=y(null),[g,m]=y(null),h=Re(async()=>t?await og(t,{limit:25,offset:0,status:i}):{requests:[]},5e3,{enabled:!!t}),b=h.data?.requests||[];L(()=>{t&&h.refresh()},[r,h.refresh,t]);let x=q((A,O)=>{c(D=>{let z=new Set(D);return O?z.add(A):z.delete(A),z})},[]),v=q(A=>{a(A),c(new Set),setTimeout(()=>h.refresh(),0)},[h.refresh]),w=q(()=>{a("all"),c(new Set),m(null),f(null),u(null)},[]),$=q(async(A,O)=>{try{await navigator.clipboard.writeText(String(A||"")),N(`${O} copied`,"success")}catch{N(`Could not copy ${String(O||"value").toLowerCase()}`,"error")}},[]),S=F(()=>e==="query"?s:n,[e,n,s]),C=F(()=>{let A={"Content-Type":"application/json"};return e==="headers"&&(A.Authorization=o),A},[o,e]),_=q(async A=>{if(!(!A||d===A.id)){if(A.payloadTruncated){N("Cannot replay a truncated payload","warning");return}u(A.id);try{let O=await fetch(S,{method:"POST",headers:C,body:String(A.payload||"")}),D=await O.text(),z=null;try{z=D?JSON.parse(D):null}catch{z=null}let E=z?.ok===!1?z?.error||"Webhook rejected":O.ok?"":z?.error||D||`HTTP ${O.status}`;if(E){N(`Replay failed: ${E}`,"error");return}N("Request replayed","success"),setTimeout(()=>h.refresh(),0)}catch(O){N(O.message||"Could not replay request","error")}finally{u(null)}}},[d,C,S,h.refresh]),k=q(async A=>{if(!(!t||!A?.id||p===A.id))try{f(A.id);let O=await rg(t,A.id);m(O?.request||A)}catch(O){N(O.message||"Could not load webhook request details","error")}finally{f(null)}},[p,t]);return{state:{requests:b,statusFilter:i,expandedRows:l,replayingRequestId:d,debugLoadingRequestId:p,debugRequest:g},actions:{refreshRequests:h.refresh,handleRequestRowToggle:x,handleSetStatusFilter:v,handleReplayRequest:_,handleCopyRequestField:$,handleAskAgentToDebug:k,setDebugRequest:m,resetState:w}}};var ho=P.bind(T),sk=({selectedHookName:t="",effectiveAuthMode:e="headers",webhookUrl:n="",webhookUrlWithQueryToken:s="",bearerTokenValue:o="",selectedWebhook:r=null,refreshNonce:i=0})=>{let{state:a,actions:l}=nk({selectedHookName:t,effectiveAuthMode:e,webhookUrl:n,webhookUrlWithQueryToken:s,bearerTokenValue:o,refreshNonce:i}),{requests:c,statusFilter:d,expandedRows:u,replayingRequestId:p,debugLoadingRequestId:f,debugRequest:g}=a,m=F(()=>tk({hookName:t,webhook:r,request:g}),[g,t,r]);return ho`
    <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-3">
        <h3 class="card-label">Request history</h3>
        <div class="flex items-center gap-2">
          ${Z1.map(h=>ho`
              <button
                class="text-xs px-2 py-1 rounded border ${d===h?"border-cyan-400 text-status-info bg-cyan-400/10":"border-border text-fg-muted hover:text-body"}"
                onclick=${()=>l.handleSetStatusFilter(h)}
              >
                ${h}
              </button>
            `)}
        </div>
      </div>

      ${c.length===0?ho`<p class="text-sm text-fg-muted">No requests logged yet.</p>`:ho`
            <div class="ac-history-list">
              ${c.map(h=>{let b=ek(h.status);return ho`
                  <details
                    class="ac-history-item"
                    open=${u.has(h.id)}
                    ontoggle=${x=>l.handleRequestRowToggle(h.id,!!x.currentTarget?.open)}
                  >
                    <summary class="ac-history-summary">
                      <div class="ac-history-summary-row">
                        <span class="inline-flex items-center gap-2 min-w-0">
                          <span class="ac-history-toggle shrink-0" aria-hidden="true"
                            >▸</span
                          >
                          <span class="truncate text-xs text-body">
                            ${Dc(h.createdAt)}
                          </span>
                        </span>
                        <span class="inline-flex items-center gap-2 shrink-0">
                          <span class="text-xs text-fg-muted"
                            >${X1(h.payloadSize)}</span
                          >
                          <span class=${`text-xs font-medium ${b.textClass}`}
                            >${h.gatewayStatus||"n/a"}</span
                          >
                          <span class="inline-flex items-center">
                            <span
                              class=${`h-2.5 w-2.5 rounded-full ${b.dotClass}`}
                              title=${h.status||"unknown"}
                              aria-label=${h.status||"unknown"}
                            ></span>
                          </span>
                        </span>
                      </div>
                    </summary>
                    ${u.has(h.id)?ho`
                          <div class="ac-history-body space-y-3">
                            <div>
                              <p class="text-[11px] text-fg-muted mb-1">Headers</p>
                              <pre
                                class="text-xs bg-field border border-border rounded p-2 overflow-auto"
                              >
${Os(h.headers)}</pre
                              >
                              <div class="mt-2 flex justify-start gap-2">
                                <button
                                  class="h-7 text-xs px-2.5 rounded-lg ac-btn-secondary"
                                  onclick=${()=>l.handleCopyRequestField(Os(h.headers),"Headers")}
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                            <div>
                              <p class="text-[11px] text-fg-muted mb-1">
                                Payload ${h.payloadTruncated?"(truncated)":""}
                              </p>
                              <pre
                                class="text-xs bg-field border border-border rounded p-2 overflow-auto"
                              >
${Os(h.payload)}</pre
                              >
                              <div class="mt-2 flex justify-start gap-2">
                                <button
                                  class="h-7 text-xs px-2.5 rounded-lg ac-btn-secondary"
                                  onclick=${()=>l.handleCopyRequestField(h.payload,"Payload")}
                                >
                                  Copy
                                </button>
                                <button
                                  class="h-7 text-xs px-2.5 rounded-lg ac-btn-secondary disabled:opacity-60"
                                  onclick=${()=>l.handleReplayRequest(h)}
                                  disabled=${h.payloadTruncated||p===h.id}
                                  title=${h.payloadTruncated?"Cannot replay truncated payload":"Replay this payload"}
                                >
                                  ${p===h.id?"Replaying...":"Replay"}
                                </button>
                              </div>
                            </div>
                            <div>
                              <p class="text-[11px] text-fg-muted mb-1">
                                Gateway response (${h.gatewayStatus||"n/a"})
                              </p>
                              <pre
                                class="text-xs bg-field border border-border rounded p-2 overflow-auto"
                              >
${Os(h.gatewayBody)}</pre
                              >
                              <div class="mt-2 flex justify-start gap-2">
                                <button
                                  class="h-7 text-xs px-2.5 rounded-lg ac-btn-secondary"
                                  onclick=${()=>l.handleCopyRequestField(h.gatewayBody,"Gateway response")}
                                >
                                  Copy
                                </button>
                                ${h.status==="error"?ho`<${Z}
                                      onClick=${()=>l.handleAskAgentToDebug(h)}
                                      loading=${f===h.id}
                                      tone="primary"
                                      size="sm"
                                      idleLabel="Ask agent to debug"
                                      loadingLabel="Loading..."
                                      className="h-7 px-2.5"
                                    />`:null}
                              </div>
                            </div>
                          </div>
                        `:null}
                  </details>
                `})}
            </div>
          `}
      <${mc}
        visible=${!!g}
        title="Ask agent to debug"
        messageLabel="Debug request"
        messageRows=${12}
        initialMessage=${m}
        resetKey=${String(g?.id||"")}
        submitLabel="Send debug request"
        loadingLabel="Sending..."
        onClose=${()=>l.setDebugRequest(null)}
        onSubmit=${async({selectedSessionKey:h,message:b})=>{try{return await fa({message:b,sessionKey:h}),N("Debug request sent to agent","success"),!0}catch(x){return N(x.message||"Could not send debug request","error"),!1}}}
      />
    </div>
  `};var ok=(t=null)=>{let e=String(t?.channel||"").trim(),n=String(t?.to||"").trim();if(!e||!n)return null;let s=String(t?.agentId||"").trim();return{channel:e,to:n,...s?{agentId:s}:{}}},PR=(t=[],e=null)=>{let n=ok(e);if(!n)return"";let s=String(n?.agentId||"").trim(),o=t.find(r=>{let i=String(r?.replyChannel||"").trim(),a=String(r?.replyTo||"").trim(),l=tf(Je(r)),c=s?l===s:!0;return i===n.channel&&a===n.to&&c});return String(o?.key||"").trim()},RR=(t=null,e=null)=>!t&&!e?!0:!t||!e?!1:String(t.channel||"").trim()===String(e.channel||"").trim()&&String(t.to||"").trim()===String(e.to||"").trim()&&String(t.agentId||"").trim()===String(e.agentId||"").trim(),rk=({selectedHookName:t="",onBackToList:e=()=>{},onRestartRequired:n=()=>{},onTestWebhookSent:s=()=>{}})=>{let[o,r]=y("headers"),[i,a]=y(!1),[l,c]=y(!1),[d,u]=y(!0),[p,f]=y(!1),[g,m]=y(!1),[h,b]=y(!1),[x,v]=y(!1),w=F(()=>`/api/webhooks/${encodeURIComponent(String(t||""))}`,[t]),$=ct(w,async()=>t&&(await Qm(t)).webhook||null,{enabled:!!t,maxAgeMs:15e3}),S=ct("/api/agents",Ao,{enabled:!0,maxAgeMs:3e4}),C=Array.isArray(S.data?.agents)?S.data.agents:[],_=F(()=>new Map(C.map(te=>[String(te?.id||"").trim(),String(te?.name||"").trim()||Bf(te?.id)])),[C]),k=$.data,A=!!t&&$.loading,O=$.error,D=!!k?.managed,z=String(k?.agentId||"main").trim()||"main",E=_.get(z)||Bf(z),M=String(k?.channel||"last").trim()||"last",R=F(()=>[t,k?.agentId,k?.channel,k?.to].map(te=>String(te||"").trim()).join("|"),[t,k?.agentId,k?.channel,k?.to]),{sessions:B,loading:I,error:U,destinationSessionKey:W,setDestinationSessionKey:G,selectedDestination:se}=Ds({enabled:!!t&&!D,resetKey:R}),K=k?.fullUrl||`.../hooks/${t}`,j=String(k?.oauthCallbackUrl||"").trim(),X=!!j,de=F(()=>{if(!X)return"";try{let te=new URL(j);return te.searchParams.has("code")||te.searchParams.set("code","TEST_AUTH_CODE"),te.searchParams.has("state")||te.searchParams.set("state","TEST_STATE"),te.searchParams.has("message")||te.searchParams.set("message","OAuth callback test"),te.toString()}catch{let te=j.includes("?")?"&":"?";return`${j}${te}code=TEST_AUTH_CODE&state=TEST_STATE&message=OAuth%20callback%20test`}},[X,j]),le=k?.queryStringUrl||`${K}${K.includes("?")?"&":"?"}token=<WEBHOOK_TOKEN>`,ie=F(()=>{try{let te=new URL(le);return String(te.searchParams.get("token")||"").trim()}catch{return""}},[le]),ne=k?.authHeaderValue||(ie?`Authorization: Bearer ${ie}`:"Authorization: Bearer <WEBHOOK_TOKEN>"),xe=ne.startsWith("Authorization: ")?ne.slice(15):ne,he=F(()=>String(t||"").trim().toLowerCase()==="gmail"?{payload:{account:"test@gmail.com",messages:[{id:"test-message-1",from:"alerts@example.com",to:["test@gmail.com"],subject:"Test Gmail webhook event",snippet:"This is a simulated Gmail message payload for webhook testing.",receivedAt:new Date().toISOString()}]}}:{source:"manual-test",message:`This is a test of the ${t||"webhook"} webhook.`},[t]),ue=JSON.stringify(he),me=`curl -X POST "${K}" -H "Content-Type: application/json" -H "${ne}" -d '${ue}'`,V=`curl -X POST "${le}" -H "Content-Type: application/json" -d '${ue}'`,J=`curl -X GET "${de}"`,oe=D?"headers":o,ce=X?J:oe==="query"?V:me,be=q(()=>{$.refresh({force:!0}),S.refresh({force:!0})},[S.refresh,$.refresh]);L(()=>{if(!t||D||!k)return;if(!Array.isArray(B)||B.length<=0){G("");return}let te=PR(B,k);G(te)},[B,t,k,D,G]);let Ve=F(()=>ok(k),[k]),et=F(()=>!RR(Ve,se),[Ve,se]),kt=q(async()=>{if(!(!t||D||x||!et)){v(!0);try{let te=await ng(t,{destination:se||null});te?.restartRequired&&n(!0),te?.syncWarning&&N(`Updated, but git-sync failed: ${te.syncWarning}`,"warning"),N("Webhook destination updated","success"),be()}catch(te){N(te.message||"Could not update webhook destination","error")}finally{v(!1)}}},[et,n,be,x,se,t,D]),Ot=q(async()=>{if(!(!t||h)){b(!0);try{let te=X?await fetch(de,{method:"GET"}):await fetch(oe==="query"?le:K,{method:"POST",headers:{"Content-Type":"application/json",...oe==="headers"?{Authorization:xe}:{}},body:ue});s();let Ee=await te.text(),ke=null;try{ke=Ee?JSON.parse(Ee):null}catch{ke=null}let H=ke?.ok===!1?ke?.error||"Webhook rejected":te.ok?"":ke?.error||Ee||`HTTP ${te.status}`;if(H){N(`Test webhook failed: ${H}`,"error");return}N("Test webhook sent","success")}catch(te){N(te.message||"Could not send test webhook","error")}finally{b(!1)}}},[xe,oe,X,de,s,t,h,ue,K,le]),Q=q(async()=>{if(!(!t||i)){a(!0);try{let te=await tg(t,{deleteTransformDir:d});te.restartRequired&&n(!0),e(),c(!1),u(!0),N("Webhook removed","success"),te.deletedTransformDir&&N("Transform directory deleted","success"),te.syncWarning&&N(`Deleted, but git-sync failed: ${te.syncWarning}`,"warning"),be()}catch(te){N(te.message||"Could not delete webhook","error")}finally{a(!1)}}},[d,i,e,n,be,t]),pe=q(async()=>{if(!(!t||p)){f(!0);try{await sg(t),N("OAuth callback rotated","success"),m(!1),be()}catch(te){N(te.message||"Could not rotate OAuth callback","error")}finally{f(!1)}}},[be,p,t]);return{state:{authMode:o,selectedWebhook:k,isWebhookLoading:A,webhookLoadError:O,selectedWebhookManaged:D,selectedDeliveryAgentName:E,selectedDeliveryChannel:M,selectableSessions:B,loadingDestinationSessions:I,destinationLoadError:U,destinationSessionKey:W,destinationDirty:et,savingDestination:x,webhookUrl:K,oauthCallbackUrl:j,hasOauthCallback:X,webhookUrlWithQueryToken:le,authHeaderValue:ne,bearerTokenValue:xe,effectiveAuthMode:oe,activeCurlCommand:ce,deleting:i,showDeleteConfirm:l,deleteTransformDir:d,rotatingOauthCallback:p,showRotateOauthConfirm:g,sendingTestWebhook:h},actions:{refreshDetail:be,setAuthMode:r,setDestinationSessionKey:G,setShowDeleteConfirm:c,setDeleteTransformDir:u,setShowRotateOauthConfirm:m,handleSaveDestination:kt,handleDeleteConfirmed:Q,handleRotateOauthCallback:pe,handleSendTestWebhook:Ot}}};var ft=P.bind(T),ik=({selectedHookName:t="",onBackToList:e=()=>{},onRestartRequired:n=()=>{},onOpenFile:s=()=>{}})=>{let[o,r]=y(0),i=q(()=>{r(W=>W+1)},[]),{state:a,actions:l}=rk({selectedHookName:t,onBackToList:e,onRestartRequired:n,onTestWebhookSent:i}),{authMode:c,selectedWebhook:d,isWebhookLoading:u,webhookLoadError:p,selectedWebhookManaged:f,selectedDeliveryAgentName:g,selectedDeliveryChannel:m,selectableSessions:h,loadingDestinationSessions:b,destinationLoadError:x,destinationSessionKey:v,destinationDirty:w,savingDestination:$,webhookUrl:S,oauthCallbackUrl:C,hasOauthCallback:_,webhookUrlWithQueryToken:k,authHeaderValue:A,bearerTokenValue:O,effectiveAuthMode:D,activeCurlCommand:z,deleting:E,showDeleteConfirm:M,deleteTransformDir:R,sendingTestWebhook:B,rotatingOauthCallback:I,showRotateOauthConfirm:U}=a;return ft`
    <div class="space-y-4">
      <div class="bg-surface border border-border rounded-xl p-4 space-y-4">
        <div>
          <h2 class="font-semibold text-sm">
            ${d?.path||`/hooks/${t}`}
          </h2>
        </div>

        ${u?ft`<div class="bg-field border border-border rounded-lg p-3">
              <p class="text-xs text-fg-muted">Loading webhook details...</p>
            </div>`:p?ft`<div class="bg-field border border-border rounded-lg p-3">
                <p class="text-xs text-status-error">
                  ${p?.message||"Could not load webhook details"}
                </p>
              </div>`:_?null:ft`<div class="bg-field border border-border rounded-lg p-3 space-y-4">
              ${f?null:ft`
                    <div class="space-y-2">
                      <p class="text-xs text-fg-muted">Auth mode</p>
                      <div class="flex items-center gap-2">
                        <button
                          class="text-xs px-2 py-1 rounded border transition-colors ${c==="headers"?"border-cyan-400 text-status-info bg-cyan-400/10":"border-border text-fg-muted hover:text-body"}"
                          onclick=${()=>l.setAuthMode("headers")}
                        >
                          Headers
                        </button>
                        <button
                          class="text-xs px-2 py-1 rounded border transition-colors ${c==="query"?"border-cyan-400 text-status-info bg-cyan-400/10":"border-border text-fg-muted hover:text-body"}"
                          onclick=${()=>l.setAuthMode("query")}
                        >
                          Query string
                        </button>
                      </div>
                    </div>
                  `}
              <div class="space-y-2">
                <p class="text-xs text-fg-muted">Webhook URL</p>
                <div class="flex items-center gap-2">
                  <input
                    type="text"
                    readonly
                    value=${D==="query"?k:S}
                    class="h-8 flex-1 bg-field border border-border rounded-lg px-3 text-xs text-body outline-none font-mono"
                  />
                  <button
                    class="h-8 text-xs px-2.5 rounded-lg ac-btn-secondary shrink-0"
                    onclick=${async()=>{try{await navigator.clipboard.writeText(D==="query"?k:S),N("Webhook URL copied","success")}catch{N("Could not copy URL","error")}}}
                  >
                    Copy
                  </button>
                </div>
              </div>
              ${f?null:D==="headers"?ft`
                      <div class="space-y-2">
                        <p class="text-xs text-fg-muted">Auth headers</p>
                        <div class="flex items-center gap-2">
                          <input
                            type="text"
                            readonly
                            value=${A}
                            class="h-8 flex-1 bg-field border border-border rounded-lg px-3 text-xs text-body outline-none font-mono"
                          />
                          <button
                            class="h-8 text-xs px-2.5 rounded-lg ac-btn-secondary shrink-0"
                            onclick=${async()=>{try{await navigator.clipboard.writeText(O),N("Bearer token copied","success")}catch{N("Could not copy bearer token","error")}}}
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    `:ft`
                      <p class="text-xs text-status-warning">
                        Always use auth headers when possible. Query string is
                        less secure.
                      </p>
                    `}
            </div>`}

        ${u||p||f||!_?null:ft`
              <div class="bg-field border border-border rounded-lg p-3 space-y-2">
                <div class="flex items-center gap-2">
                  <p class="text-xs text-fg-muted">OAuth Callback URL</p>
                  ${_?ft`<${ae} tone="neutral">OAuth alias</${ae}>`:null}
                </div>
                <div class="flex items-center gap-2">
                  <input
                    type="text"
                    readonly
                    value=${_?C:"Not enabled"}
                    class="h-8 flex-1 bg-field border border-border rounded-lg px-3 text-xs text-body outline-none font-mono"
                  />
                  ${_?ft`
                        <button
                          class="h-8 text-xs px-2.5 rounded-lg ac-btn-secondary shrink-0"
                          onclick=${async()=>{try{await navigator.clipboard.writeText(C),N("OAuth callback URL copied","success")}catch{N("Could not copy URL","error")}}}
                        >
                          Copy
                        </button>
                      `:null}
                </div>
                <div class="flex items-center justify-start gap-3 flex-wrap">
                  <div class="flex items-center gap-2">
                    <button
                      class="h-8 text-xs px-2.5 rounded-lg ac-btn-secondary disabled:opacity-60"
                      onclick=${()=>{I||l.setShowRotateOauthConfirm(!0)}}
                      disabled=${I}
                    >
                      ${I?"Rotating...":"Rotate"}
                    </button>
                  </div>
                  <p class="text-xs text-status-warning">
                    Keep this URL private. Rotate if exposed.
                  </p>
                </div>
              </div>
            `}

        <div class="bg-field border border-border rounded-lg p-3 space-y-2">
          ${f?ft`
                <p class="text-xs text-fg-muted">Deliver to</p>
                <p class="text-xs text-body font-mono">
                  ${g}${" "}
                  <span class="text-xs text-fg-muted font-mono"
                    >(${m})</span
                  >
                </p>
              `:ft`
                <p class="text-xs text-fg-muted">Deliver to</p>
                <div class="flex items-center gap-2">
                  <select
                    value=${v||Is}
                    onInput=${W=>{let G=String(W.currentTarget?.value||"");l.setDestinationSessionKey(G===Is?"":G)}}
                    disabled=${b||$}
                    class="h-8 flex-1 bg-field border border-border rounded-lg px-3 text-xs text-body focus:border-fg-muted"
                  >
                    <option value=${Is}>Default</option>
                    ${b?ft`<option value="" disabled>Loading...</option>`:h.map(W=>ft`
                            <option value=${Je(W)}>
                              ${String(W?.label||Je(W)||"Session")}
                            </option>
                          `)}
                  </select>
                  <${Z}
                    onClick=${l.handleSaveDestination}
                    disabled=${!w||$}
                    loading=${$}
                    tone="secondary"
                    size="sm"
                    idleLabel="Save"
                    loadingLabel="Saving..."
                    className="px-2.5 py-1"
                  />
                </div>
                ${x?ft`<p class="text-xs text-status-error-muted">${x}</p>`:null}
              `}
        </div>

        <div class="bg-field border border-border rounded-lg p-3 space-y-2">
          <p class="text-xs text-fg-muted">Test webhook</p>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              readonly
              value=${z}
              class="h-8 w-full sm:flex-1 sm:min-w-0 bg-field border border-border rounded-lg px-3 text-xs text-body outline-none font-mono overflow-x-auto scrollbar-hidden"
            />
            <div class="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
              <button
                class="h-8 text-xs px-2.5 rounded-lg ac-btn-secondary w-full sm:w-auto sm:shrink-0"
                onclick=${async()=>{try{await navigator.clipboard.writeText(z),N("curl command copied","success")}catch{N("Could not copy curl command","error")}}}
              >
                Copy
              </button>
              <button
                class="h-8 text-xs px-2.5 rounded-lg ac-btn-secondary w-full sm:w-auto sm:shrink-0 disabled:opacity-60"
                onclick=${l.handleSendTestWebhook}
                disabled=${B}
              >
                ${B?"Sending...":"Send"}
              </button>
            </div>
          </div>
        </div>

        <div class="bg-field border border-border rounded-lg p-3">
          <div class="flex items-center gap-2 text-xs text-body">
            <span class="text-fg-muted">Transform:</span>
            ${d?.transformPath?ft`<button
                  type="button"
                  class="ac-tip-link flex-1 min-w-0 truncate block text-left font-mono"
                  title=${d.transformPath}
                  onclick=${()=>s(d.transformPath)}
                >
                  ${d.transformPath}
                </button>`:ft`<code class="flex-1 min-w-0 truncate block">—</code>`}
            <span
              class=${`ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-sans ${d?.transformExists?"border-green-500/30 text-status-success bg-green-500/10":"border-yellow-500/30 text-status-warning bg-yellow-500/10"}`}
            >
              <span class="font-sans text-sm leading-none">
                ${d?.transformExists?"\u2713":"!"}
              </span>
              ${d?.transformExists?null:ft`<span>missing</span>`}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <p class="text-xs text-fg-dim">
            Created: ${Y1(d?.createdAt)}
          </p>
          ${f?null:ft`<${Z}
                onClick=${()=>{E||(l.setDeleteTransformDir(!0),l.setShowDeleteConfirm(!0))}}
                disabled=${E}
                loading=${E}
                tone="danger"
                size="sm"
                idleLabel="Delete"
                loadingLabel="Deleting..."
                className="shrink-0 px-2.5 py-1"
              />`}
        </div>
      </div>

      ${f&&!u&&!p?ft`
            <div class="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
              <p class="text-xs text-status-warning">
                This webhook is managed by Gmail Watch setup and cannot be
                deleted or edited from this page.
              </p>
            </div>
          `:null}
      <${sk}
        selectedHookName=${t}
        selectedWebhook=${d}
        effectiveAuthMode=${D}
        webhookUrl=${S}
        webhookUrlWithQueryToken=${k}
        bearerTokenValue=${O}
        refreshNonce=${o}
      />
      <${st}
        visible=${U&&!!t&&!f&&_}
        title="Rotate OAuth callback?"
        message="Rotating will generate a new callback URL and immediately invalidate the current URL."
        confirmLabel="Rotate callback URL"
        confirmLoadingLabel="Rotating..."
        confirmLoading=${I}
        cancelLabel="Cancel"
        onCancel=${()=>{I||l.setShowRotateOauthConfirm(!1)}}
        onConfirm=${l.handleRotateOauthCallback}
      />
      <${st}
        visible=${M&&!!t&&!f}
        title="Delete webhook?"
        message=${`This removes "/hooks/${t}" from openclaw.json.`}
        details=${ft`
          <div class="rounded-lg border border-border bg-field p-3">
            <label class="flex items-center gap-2 text-xs text-body select-none">
              <input
                type="checkbox"
                checked=${R}
                onInput=${W=>l.setDeleteTransformDir(!!W.target.checked)}
              />
              Also delete <code>hooks/transforms/${t}</code>
            </label>
          </div>
        `}
        confirmLabel="Delete webhook"
        confirmLoadingLabel="Deleting..."
        confirmLoading=${E}
        cancelLabel="Cancel"
        onCancel=${()=>{E||(l.setDeleteTransformDir(!0),l.setShowDeleteConfirm(!1))}}
        onConfirm=${l.handleDeleteConfirmed}
      />
    </div>
  `};var ak=({onSelectHook:t=()=>{}})=>{let e=Re(Xm,15e3),n=e.data?.webhooks||[],s=!e.data&&!e.error,o=q(r=>{t(r)},[t]);return{state:{webhooks:n,isListLoading:s},actions:{refreshList:e.refresh,handleSelectHook:o}}};var Bs=P.bind(T),lk=({onSelectHook:t=()=>{}})=>{let{state:e,actions:n}=ak({onSelectHook:t}),{webhooks:s,isListLoading:o}=e;return Bs`
    <div class="bg-surface border border-border rounded-xl p-4 space-y-4">
      ${o?Bs`<p class="text-xs text-fg-muted">Loading webhooks...</p>`:null}
      ${!o&&s.length===0?Bs`<p class="text-sm text-fg-muted">
            No webhooks configured yet. Create one to get started.
          </p>`:null}
      ${s.length>0?Bs`
            <div class="overflow-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-xs text-fg-muted border-b border-border">
                    <th class="pb-2 pr-3">Path</th>
                    <th class="pb-2 pr-3">Last received</th>
                    <th class="pb-2 pr-3">Errors</th>
                    <th class="pb-2 pr-3">Health</th>
                    <th class="pb-2 pr-3">Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr aria-hidden="true">
                    <td class="h-2 p-0" colspan="5"></td>
                  </tr>
                  ${s.map(r=>Bs`
                      <tr
                        class="group cursor-pointer"
                        onclick=${()=>n.handleSelectHook(r.name)}
                      >
                        <td
                          class="px-3 py-2.5 group-hover:bg-surface first:rounded-l-lg transition-colors"
                        >
                          <code>${r.path||`/hooks/${r.name}`}</code>
                        </td>
                        <td
                          class="px-3 py-2.5 text-xs text-fg-muted group-hover:bg-surface transition-colors"
                        >
                          ${Dc(r.lastReceived)}
                        </td>
                        <td
                          class="px-3 py-2.5 text-xs group-hover:bg-surface transition-colors"
                        >
                          ${r.errorCount||0}
                        </td>
                        <td
                          class="px-3 py-2.5 group-hover:bg-surface last:rounded-r-lg transition-colors"
                        >
                          <span
                            class="inline-block w-2.5 h-2.5 rounded-full ${Q1(r.health)}"
                            title=${r.health}
                          />
                        </td>
                        <td
                          class="px-3 py-2.5 text-xs text-fg-muted group-hover:bg-surface transition-colors"
                        >
                          ${r.managed?Bs`<span
                                class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] bg-cyan-500/10 text-status-info"
                                >Managed</span
                              >`:r.oauthCallbackEnabled?Bs`<${ae} tone="neutral">OAuth</${ae}>`:Bs`<${ae} tone="neutral">Custom</${ae}>`}
                        </td>
                      </tr>
                    `)}
                </tbody>
              </table>
            </div>
          `:null}
    </div>
  `};var Xi=P.bind(T),ck=({selectedHookName:t="",onSelectHook:e=()=>{},onBackToList:n=()=>{},onRestartRequired:s=()=>{},onOpenFile:o=()=>{}})=>{let[r,i]=y(!1),[a,l]=y(""),[c,d]=y("webhook"),[u,p]=y(!1),f=F(()=>{let m=String(a||"").trim().toLowerCase();return Of.test(m)},[a]),g=q(async(m=null,h="webhook")=>{let b=String(a||"").trim().toLowerCase();if(!Of.test(b)){N("Name must be lowercase letters, numbers, and hyphens","error");return}if(!u){p(!0);try{let x=await eg(b,{destination:m,oauthCallback:h==="oauth"});i(!1),l(""),d("webhook"),e(b),x.restartRequired&&s(!0),h==="oauth"&&x?.webhook?.oauthCallbackUrl?N("Webhook + OAuth callback created","success"):N("Webhook created","success"),x.syncWarning&&N(`Created, but git-sync failed: ${x.syncWarning}`,"warning")}catch(x){N(x.message||"Could not create webhook","error")}finally{p(!1)}}},[u,a,s,e]);return Xi`
    <div class="space-y-4">
      <${Ne}
        title="Webhooks"
        leading=${t?Xi`
              <button
                class="flex items-center gap-1.5 text-sm text-fg-muted hover:text-body transition-colors"
                onclick=${n}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path
                    d="M10.354 3.354a.5.5 0 00-.708-.708l-5 5a.5.5 0 000 .708l5 5a.5.5 0 00.708-.708L5.707 8l4.647-4.646z"
                  />
                </svg>
                Back
              </button>
            `:null}
        actions=${t?null:Xi`
              <${Z}
                onClick=${()=>{d("webhook"),i(m=>!m)}}
                tone="secondary"
                size="sm"
                idleLabel="Create new"
                className="px-3 py-1.5"
              />
            `}
      />

      ${t?Xi`
            <${ik}
              selectedHookName=${t}
              onBackToList=${n}
              onRestartRequired=${s}
              onOpenFile=${o}
            />
          `:Xi`
            <${lk}
              onSelectHook=${m=>{e(m)}}
            />
          `}

      <${J1}
        visible=${r&&!t}
        name=${a}
        mode=${c}
        onModeChange=${d}
        onNameChange=${l}
        canCreate=${f}
        creating=${u}
        onCreate=${g}
        onClose=${()=>{i(!1),d("webhook")}}
      />
    </div>
  `};var LR=P.bind(T),Nc=({hookName:t="",routeHistoryRef:e=null,getCurrentPath:n=()=>"",onSetLocation:s=()=>{},onRestartRequired:o=()=>{},onNavigateToBrowseFile:r=()=>{}})=>LR`
    <div class="pt-4">
      <${ck}
        selectedHookName=${t}
        onSelectHook=${a=>s(`/webhooks/${encodeURIComponent(a)}`)}
        onBackToList=${()=>{if(!((e?.current||[]).length>1)){s("/webhooks");return}let c=n();window.history.back(),window.setTimeout(()=>{n()===c&&s("/webhooks")},180)}}
        onRestartRequired=${o}
        onOpenFile=${a=>r(String(a||"").trim(),{view:"edit"})}
      />
    </div>
  `;var dk=()=>{let[t,e]=y([]),[n,s]=y(!0),[o,r]=y(!1),i=q(async()=>{s(!0);try{let u=await Ao();e(Array.isArray(u?.agents)?u.agents:[])}finally{s(!1)}},[]);L(()=>{i()},[i]);let a=q(async u=>{r(!0);try{let p=await qm(u);return e(f=>[...f,p.agent]),p.agent}finally{r(!1)}},[]),l=q(async(u,p)=>{r(!0);try{let f=await Jm(u,p);return e(g=>g.map(m=>m.id===u?f.agent:m)),f.agent}finally{r(!1)}},[]),c=q(async u=>{r(!0);try{await Ym(u),e(p=>p.map(f=>({...f,default:f.id===u})))}finally{r(!1)}},[]),d=q(async(u,p={})=>{r(!0);try{await Zm(u,p),e(f=>f.filter(g=>g.id!==u))}finally{r(!1)}},[]);return{state:{agents:t,loading:n,saving:o},actions:{create:a,loadAgents:i,remove:d,setDefault:c,update:l}}};var ER=[{type:"file",path:"openclaw.json"},{type:"directory",path:"hooks/transforms"}],uk=t=>String(t||"").trim().replace(/^\/+|\/+$/g,""),IR=(t,e)=>{let n=uk(t);if(!n||!e||typeof e!="object")return!1;let s=String(e.type||"").toLowerCase(),o=uk(e.path);return o?s==="directory"?n===o||n.startsWith(`${o}/`):s==="file"?n===o:!1:!1},pk=t=>ER.some(e=>IR(t,e));var fk=({location:t=""}={})=>{let[n,s]=y(null),[o,r]=y(!1),[i,a]=y(null),[l,c]=y(null),[d,u]=y(!1),[p,f]=y(!1),[g,m]=y(!1),[h,b]=y(!1),[x,v]=y(!1),[w,$]=y(0),[S,C]=y(15e3),[_,k]=y(!1),[A,O]=y(!1),[D,z]=y(!1),[E,M]=y(null),[R,B]=y(null),[I,U]=y(null),W=Re(So,S,{enabled:n===!0&&!D&&_,cacheKey:"/api/status"}),G=Re(im,S,{enabled:n===!0&&!D&&_,cacheKey:"/api/watchdog/status"}),se=Re(ua,S,{enabled:n===!0&&!D&&_,cacheKey:"/api/doctor/status"}),K=E||W.data||null,j=R||G.data?.status||null,X=I||se.data?.status||null,de=g||h,le=q(()=>{W.refresh(),G.refresh(),se.refresh()},[se.refresh,W.refresh,G.refresh]);L(()=>{Nm().then(V=>s(V.onboarded)).catch(()=>s(!1)),Im().then(V=>r(!!V.authEnabled)).catch(()=>{})},[]),L(()=>{if(n!==!0)return k(!1),()=>{};let V=setTimeout(()=>{k(!0)},5e3);return()=>{clearTimeout(V)}},[n]),L(()=>{if(n!==!0)return;let V=!1,oe=(()=>{if(!V)try{return Hh({onOpen:()=>{V||z(!0)},onMessage:(ce={})=>{V||(ce.status&&typeof ce.status=="object"&&M(ce.status),ce.watchdogStatus&&typeof ce.watchdogStatus=="object"&&B(ce.watchdogStatus),ce.doctorStatus&&typeof ce.doctorStatus=="object"&&U(ce.doctorStatus))},onError:()=>{V||z(!1)}})}catch{return z(!1),null}})();return()=>{V=!0,z(!1),typeof oe=="function"&&oe()}},[n]),L(()=>{if(!n)return;let V=!0,J=async(ce=!1)=>{try{let be=await gm(ce);if(!V)return;a(be.currentVersion||null),c(be.latestVersion||null),u(!!be.hasUpdate)}catch{}};J(!0);let oe=setInterval(()=>J(!1),300*1e3);return()=>{V=!1,clearInterval(oe)}},[n]);let ie=q(async()=>{if(n)try{let V=await om();m(!!V.restartRequired),v(!!V.restartInProgress)}catch{}},[n]);L(()=>{n&&ie()},[n,ie]),L(()=>{if(n!==!0)return;let V=t.startsWith("/general")||t.startsWith("/watchdog"),J=K?.gateway??null,oe=String(j?.health||"").toLowerCase(),ce=String(j?.lifecycle||"").toLowerCase(),be=oe==="unknown"||ce==="restarting"||ce==="stopped"||!!j?.operationInProgress,et=V&&(be||(!J||J!=="running"))?2e3:15e3;C(kt=>kt===et?kt:et)},[t,n,K?.gateway,j?.health,j?.lifecycle,j?.operationInProgress]),L(()=>{if(!n||!g&&!x)return;let V=setInterval(ie,2e3);return()=>clearInterval(V)},[n,g,x,ie]),L(()=>{let V=J=>{let oe=String(J?.detail?.path||"");pk(oe)&&b(!0)};return window.addEventListener("alphaclaw:browse-file-saved",V),()=>{window.removeEventListener("alphaclaw:browse-file-saved",V)}},[]),L(()=>{let V=()=>m(!0);return window.addEventListener("alphaclaw:restart-required",V),()=>{window.removeEventListener("alphaclaw:restart-required",V)}},[]);let ne=q(async()=>{if(!x){v(!0);try{let V=await sm();if(!V?.ok)throw new Error(V?.error||"Gateway restart failed");m(!!V.restartRequired),b(!1),$(Date.now()),le(),N("Gateway restarted","success"),setTimeout(ie,800)}catch(V){N(V.message||"Restart failed","error"),setTimeout(ie,800)}finally{v(!1)}}},[ie,le,x]),xe=q(async()=>{if(A)return{ok:!1,error:"OpenClaw update already in progress"};O(!0);try{return await ma()}finally{O(!1),le(),setTimeout(le,1200),setTimeout(le,3500),setTimeout(ie,1200)}},[A,ie,le]),he=q(({type:V})=>{V==="update"&&(le(),setTimeout(le,1200))},[le]),ue=q(async()=>{if(!p){f(!0);try{let V=await xm();V.ok?(N("AlphaClaw updated \u2014 restarting...","success"),setTimeout(()=>window.location.reload(),5e3)):(N(V.error||"AlphaClaw update failed","error"),f(!1))}catch(V){N(V.message||"Could not update AlphaClaw","error"),f(!1)}}},[p]),me=q(async()=>{m(!1),b(!1);try{await rm(),await ie()}catch(V){N(V.message||"Could not dismiss restart banner","error"),await ie()}},[ie]);return{state:{acHasUpdate:d,acLatest:l,acUpdating:p,acVersion:i,authEnabled:o,gatewayRestartSignal:w,isAnyRestartRequired:de,onboarded:n,openclawUpdateInProgress:A,restartingGateway:x,sharedDoctorStatus:X,sharedStatus:K,sharedWatchdogStatus:j},actions:{handleAcUpdate:ue,handleGatewayRestart:ne,handleOnboardingComplete:()=>s(!0),handleOpenclawUpdate:xe,handleOpenclawVersionActionComplete:he,refreshSharedStatuses:le,dismissRestartBanner:me,setRestartRequired:m}}};var DR=220,NR=180,OR=460,hk=t=>Math.max(NR,Math.min(OR,t)),mk=()=>{let t=ee(null),e=ee(null),[n,s]=y(!1),[o,r]=y(()=>{let h=Fe();return Number.isFinite(h.sidebarWidthPx)?hk(h.sidebarWidthPx):DR}),[i,a]=y(!1),[l,c]=y(!1),[d,u]=y(!1),p=q(h=>{e.current&&!e.current.contains(h.target)&&s(!1)},[]);L(()=>{if(n)return document.addEventListener("click",p,!0),()=>document.removeEventListener("click",p,!0)},[p,n]),L(()=>{if(!l)return;let h=document.body.style.overflow;return document.body.style.overflow="hidden",()=>{document.body.style.overflow=h}},[l]),L(()=>{let h=Fe();h.sidebarWidthPx=o,Ct(h)},[o]);let f=q(h=>{let b=t.current;if(!b)return;let x=b.getBoundingClientRect(),v=hk(Math.round(h-x.left));r(v)},[]),g=q(h=>{h.preventDefault(),a(!0),f(h.clientX)},[f]);L(()=>{if(!i)return()=>{};let h=w=>f(w.clientX),b=()=>a(!1);window.addEventListener("pointermove",h),window.addEventListener("pointerup",b);let x=document.body.style.userSelect,v=document.body.style.cursor;return document.body.style.userSelect="none",document.body.style.cursor="col-resize",()=>{window.removeEventListener("pointermove",h),window.removeEventListener("pointerup",b),document.body.style.userSelect=x,document.body.style.cursor=v}},[i,f]);let m=q(h=>{let b=h.currentTarget.scrollTop>0;u(x=>x===b?x:b)},[]);return{refs:{appShellRef:t,menuRef:e},state:{isResizingSidebar:i,menuOpen:n,mobileSidebarOpen:l,mobileTopbarScrolled:d,sidebarWidthPx:o},actions:{closeMobileSidebar:()=>c(!1),handlePaneScroll:m,onSidebarResizerPointerDown:g,onToggleMenu:()=>s(h=>!h),setMenuOpen:s,setMobileSidebarOpen:c}}};var mo="general",gk=[{label:"Setup",items:[{id:"general",label:"General"}]},{label:"Monitoring",items:[{id:"cron",label:"Cron"},{id:"usage",label:"Usage"},{id:"doctor",label:"Doctor"},{id:"watchdog",label:"Watchdog"}]},{label:"Config",items:[{id:"models",label:"Models"},{id:"envars",label:"Envars"},{id:"webhooks",label:"Webhooks"},{id:"nodes",label:"Nodes"}]}],bk=({isBrowseRoute:t=!1,location:e=""}={})=>t?"browse":e.startsWith("/telegram")?"":e.startsWith("/models")?"models":e.startsWith("/agents")?"agents":e.startsWith("/providers")?"models":e.startsWith("/watchdog")?"watchdog":e.startsWith("/cron")?"cron":e.startsWith("/usage")?"usage":e.startsWith("/doctor")?"doctor":e.startsWith("/nodes")?"nodes":e.startsWith("/envars")?"envars":e.startsWith("/webhooks")?"webhooks":mo;var Oc=t=>String(t||"").replace(/^\/+|\/+$/g,""),Qi=(t,e={})=>{let n=String(e?.view||"edit"),s=String(t||"").split("/").filter(Boolean).map(a=>encodeURIComponent(a)).join("/"),o=s?`/browse/${s}`:"/browse",r=new URLSearchParams;n==="diff"&&s&&r.set("view","diff"),e.line&&r.set("line",String(e.line)),e.lineEnd&&r.set("lineEnd",String(e.lineEnd));let i=r.toString();return i?`${o}?${i}`:o},xk=({location:t="",browsePreviewPath:e=""}={})=>{let n=t.startsWith("/browse"),s=n?String(t||"").split("?")[0]:"",o=n&&String(t||"").includes("?")?String(t||"").split("?").slice(1).join("?"):"",r=n?s.replace(/^\/browse\/?/,"").split("/").filter(Boolean).map(u=>{try{return decodeURIComponent(u)}catch{return u}}).join("/"):"",i=e||r,a=n?new URLSearchParams(o):null,l=!e&&a?.get("view")==="diff"?"diff":"edit",c=Number.parseInt(a?.get("line")||"",10)||0,d=Number.parseInt(a?.get("lineEnd")||"",10)||0;return{activeBrowsePath:i,browseLineEndTarget:d,browseLineTarget:c,browseViewerMode:l,isBrowseRoute:n,selectedBrowsePath:r}};var Ff="browseLastPath",yk="lastMenuRoute",vk=({location:t="",setLocation:e=()=>{},onCloseMobileSidebar:n=()=>{}}={})=>{let[s,o]=y(()=>t.startsWith("/browse")?"browse":"menu"),[r,i]=y(()=>{let k=Fe();return typeof k[Ff]=="string"?k[Ff]:""}),[a,l]=y(()=>{let A=Fe()[yk];return typeof A=="string"&&A.startsWith("/")&&!A.startsWith("/browse")&&!A.startsWith("/agents")?A:`/${mo}`}),[c,d]=y(""),u=ee([]),{activeBrowsePath:p,browseLineEndTarget:f,browseLineTarget:g,browseViewerMode:m,isBrowseRoute:h,selectedBrowsePath:b}=xk({location:t,browsePreviewPath:c}),x=bk({isBrowseRoute:h,location:t});L(()=>{o(k=>t.startsWith("/browse")?"browse":k==="browse"?"menu":k)},[t]),L(()=>{t.startsWith("/browse")||d("")},[t]),L(()=>{let k=u.current;k[k.length-1]!==t&&(k.push(t),k.length>100&&k.shift())},[t]),L(()=>{t.startsWith("/browse")||t.startsWith("/telegram")||l(k=>k===t?k:t)},[t]),L(()=>{h&&b&&i(k=>k===b?k:b)},[h,b]),L(()=>{let k=()=>{if(!h||m!=="diff")return;let A=String(b||"").trim();A&&e(Qi(A,{view:"edit"}))};return window.addEventListener("alphaclaw:browse-git-synced",k),()=>{window.removeEventListener("alphaclaw:browse-git-synced",k)}},[m,h,b,e]),L(()=>{let k=Fe();k[Ff]=r,k[yk]=a,Ct(k)},[r,a]);let v=q(k=>{e(`/${k}`),n()},[n,e]),w=q(k=>{let A=Oc(k);d(A)},[]),$=q((k,A={})=>{let O=Oc(k),D=!!A.directory||String(k||"").trim().endsWith("/"),z=D&&!!A.preservePreview,E=Oc(c||b||"");d(z&&E&&E!==O?E:"");let R=D?{...A,view:"edit"}:A;e(Qi(O,R)),n()},[c,n,b,e]),S=q(k=>{if(o(k),k==="menu"&&t.startsWith("/browse")){d(""),e(a||`/${mo}`);return}if(k==="browse"&&!t.startsWith("/browse")){e(Qi(r));return}},[r,a,t,e]),C=q(k=>{e(`/${k}`),n()},[n,e]),_=q(()=>{e(`/${mo}`),n()},[n,e]);return{state:{activeBrowsePath:p,browseLineEndTarget:f,browseLineTarget:g,browsePreviewPath:c,browseViewerMode:m,isBrowseRoute:h,routeHistoryRef:u,selectedBrowsePath:b,selectedNavId:x,sidebarTab:s},actions:{buildBrowseRoute:Qi,clearBrowsePreview:()=>d(""),exitSubScreen:_,handleBrowsePreviewFile:w,handleSelectNavItem:C,handleSelectSidebarTab:S,navigateToBrowseFile:$,navigateToSubScreen:v},constants:{kNavSections:gk}}};var Hf=()=>{let t=window.location.hash.replace(/^#/,"");return t?t.startsWith("/")?t:`/${t}`:`/${mo}`},$k=()=>{let[t,e]=y(Hf);L(()=>{let s=()=>e(Hf());return window.addEventListener("hashchange",s),()=>window.removeEventListener("hashchange",s)},[]);let n=q(s=>{let o=s.startsWith("/")?s:`/${s}`,r=`#${o}`;if(window.location.hash!==r){window.location.hash=o;return}e(o)},[]);return[t,n]},Wf=Hf;var Ut=P.bind(T),wk="doctorWarningDismissedUntilMs",BR=10080*60*1e3,Bc="__alphaclawPendingCreateAgent",FR=()=>{let[t,e]=ca(),[n,s]=y(()=>{let C=Fe();return Number(C[wk]||0)}),{state:o,actions:r}=fk({location:t}),{refs:i,state:a,actions:l}=mk(),{state:c,actions:d,constants:u}=vk({location:t,setLocation:e,onCloseMobileSidebar:l.closeMobileSidebar}),{state:p,actions:f}=dk(),g=t.startsWith("/agents"),m=t.startsWith("/cron"),h=t.startsWith("/envars"),b=t.startsWith("/models"),x=t.startsWith("/nodes"),v=(()=>{let C=t.match(/^\/agents\/([^/]+)/);return C?decodeURIComponent(C[1]):""})(),w=(()=>{let C=t.match(/^\/agents\/[^/]+\/([^/]+)/);return(C?C[1]:"")==="tools"?"tools":"overview"})(),$=(()=>{let C=t.match(/^\/cron\/([^/]+)/);return C?decodeURIComponent(C[1]):""})();L(()=>{g&&(window[Bc]||v||p.loading||p.agents.length===0||e(`/agents/${encodeURIComponent(p.agents[0].id)}`))},[g,v,p.loading,p.agents,e]),L(()=>{g&&window[Bc]&&(window[Bc]=!1,window.setTimeout(()=>{window.dispatchEvent(new Event("alphaclaw:create-agent"))},0))},[g]),L(()=>{let C=Fe();C[wk]=n,Ct(C)},[n]);let S=async()=>{l.setMenuOpen(!1),await Dm();try{window.localStorage.clear(),window.sessionStorage.clear()}catch{}window.location.href="/login.html"};return o.onboarded===null?Ut`
      <div
        class="min-h-screen flex items-center justify-center"
        style="position: relative; z-index: 1"
      >
        <${Ce}
          className="h-6 w-6"
          style="color: var(--text-muted)"
        />
      </div>
      <${Na} />
    `:o.onboarded?Ut`
    <div
      class="app-shell"
      ref=${i.appShellRef}
      style=${{"--sidebar-width":`${a.sidebarWidthPx}px`}}
    >
      <${jb}
        visible=${o.isAnyRestartRequired}
        restarting=${o.restartingGateway}
        onRestart=${r.handleGatewayRestart}
        onDismiss=${r.dismissRestartBanner}
      />
      <${Cx}
        mobileSidebarOpen=${a.mobileSidebarOpen}
        authEnabled=${o.authEnabled}
        menuRef=${i.menuRef}
        menuOpen=${a.menuOpen}
        onToggleMenu=${l.onToggleMenu}
        onLogout=${S}
        sidebarTab=${c.sidebarTab}
        onSelectSidebarTab=${d.handleSelectSidebarTab}
        navSections=${u.kNavSections}
        selectedNavId=${c.selectedNavId}
        onSelectNavItem=${d.handleSelectNavItem}
        selectedBrowsePath=${c.selectedBrowsePath}
        onSelectBrowseFile=${d.navigateToBrowseFile}
        onPreviewBrowseFile=${d.handleBrowsePreviewFile}
        acHasUpdate=${o.acHasUpdate}
        acLatest=${o.acLatest}
        acUpdating=${o.acUpdating}
        onAcUpdate=${r.handleAcUpdate}
        agents=${p.agents}
        selectedAgentId=${v}
        onSelectAgent=${C=>e(`/agents/${encodeURIComponent(C)}`)}
        onAddAgent=${()=>{if(g){window.dispatchEvent(new Event("alphaclaw:create-agent"));return}window[Bc]=!0,e("/agents")}}
      />
      <div
        class=${`sidebar-resizer ${a.isResizingSidebar?"is-resizing":""}`}
        onpointerdown=${l.onSidebarResizerPointerDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
      ></div>

      <div
        class=${`mobile-sidebar-overlay ${a.mobileSidebarOpen?"active":""}`}
        onclick=${l.closeMobileSidebar}
      />

      <div class="app-content">
        <div
          class=${`mobile-topbar ${a.mobileTopbarScrolled?"is-scrolled":""}`}
        >
          <button
            class="mobile-topbar-menu"
            onclick=${()=>l.setMobileSidebarOpen(C=>!C)}
            aria-label="Open menu"
            aria-expanded=${a.mobileSidebarOpen?"true":"false"}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path
                d="M2 3.75a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 3.75zm0 4.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 8zm0 4.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
              />
            </svg>
          </button>
          <span class="mobile-topbar-title">
            <span style="color: var(--accent)">alpha</span>claw
          </span>
        </div>
        ${c.isBrowseRoute?Ut`
              <div class="app-content-pane browse-pane">
                <${uu}
                  activeBrowsePath=${c.activeBrowsePath}
                  browseView=${c.browseViewerMode}
                  lineTarget=${c.browseLineTarget}
                  lineEndTarget=${c.browseLineEndTarget}
                  selectedBrowsePath=${c.selectedBrowsePath}
                  onNavigateToBrowseFile=${d.navigateToBrowseFile}
                  onEditSelectedBrowseFile=${()=>e(d.buildBrowseRoute(c.selectedBrowsePath,{view:"edit"}))}
                  onClearSelection=${()=>{d.clearBrowsePreview(),e("/browse")}}
                />
              </div>
            `:null}
        ${g?Ut`
              <div class="app-content-pane agents-pane">
                <${au}
                  agents=${p.agents}
                  loading=${p.loading}
                  saving=${p.saving}
                  agentsActions=${f}
                  selectedAgentId=${v}
                  activeTab=${w}
                  onSelectAgent=${C=>e(`/agents/${encodeURIComponent(C)}`)}
                  onSelectTab=${C=>{let _=C&&C!=="overview"?`/agents/${encodeURIComponent(v)}/${C}`:`/agents/${encodeURIComponent(v)}`;e(_)}}
                  onNavigateToBrowseFile=${d.navigateToBrowseFile}
                  onSetLocation=${e}
                />
              </div>
            `:null}
        ${m?Ut`
              <div class="app-content-pane cron-pane">
                <${rf}
                  jobId=${$}
                  onSetLocation=${e}
                />
              </div>
            `:null}
        ${h?Ut`
              <div class="app-content-pane ac-fixed-header-pane">
                <${uf}
                  onRestartRequired=${r.setRestartRequired}
                />
              </div>
            `:null}
        ${b?Ut`
              <div class="app-content-pane ac-fixed-header-pane">
                <${hf}
                  onRestartRequired=${r.setRestartRequired}
                />
              </div>
            `:null}
        ${x?Ut`
              <div class="app-content-pane">
                <${mf}
                  onRestartRequired=${r.setRestartRequired}
                />
              </div>
            `:null}
        ${c.isBrowseRoute||g||m||h||b||x?null:Ut`
              <div
                class="app-content-pane"
                onscroll=${l.handlePaneScroll}
              >
          <div class="max-w-2xl w-full mx-auto">
            <${rd}>
                    <${rt} path="/general">
                      <${ff}
                        statusData=${o.sharedStatus}
                        watchdogData=${o.sharedWatchdogStatus}
                        doctorStatusData=${o.sharedDoctorStatus}
                        agents=${p.agents}
                        doctorWarningDismissedUntilMs=${n}
                        onRefreshStatuses=${r.refreshSharedStatuses}
                        onSetLocation=${e}
                        onNavigate=${d.navigateToSubScreen}
                        restartingGateway=${o.restartingGateway}
                        onRestartGateway=${r.handleGatewayRestart}
                        restartSignal=${o.gatewayRestartSignal}
                        openclawUpdateInProgress=${o.openclawUpdateInProgress}
                        onOpenclawVersionActionComplete=${r.handleOpenclawVersionActionComplete}
                        onOpenclawUpdate=${r.handleOpenclawUpdate}
                        onRestartRequired=${r.setRestartRequired}
                        onDismissDoctorWarning=${()=>s(Date.now()+BR)}
                      />
                    </${rt}>
                    <${rt} path="/doctor">
                      <${df} onNavigateToBrowseFile=${d.navigateToBrowseFile} />
                    </${rt}>
                    <${rt} path="/telegram/:accountId">
                      ${C=>Ut`
                        <${yf}
                          accountId=${decodeURIComponent(C.accountId||"default")}
                          onBack=${d.exitSubScreen}
                        />
                      `}
                    </${rt}>
                    <${rt} path="/telegram">
                      <${Ki} to="/telegram/default" />
                    </${rt}>
                    <${rt} path="/providers">
                      <${Ki} to="/models" />
                    </${rt}>
                    <${rt} path="/watchdog">
                      <${Df}
                        statusData=${o.sharedStatus}
                        watchdogStatus=${o.sharedWatchdogStatus}
                        onRefreshStatuses=${r.refreshSharedStatuses}
                        restartingGateway=${o.restartingGateway}
                        onRestartGateway=${r.handleGatewayRestart}
                        restartSignal=${o.gatewayRestartSignal}
                        openclawUpdateInProgress=${o.openclawUpdateInProgress}
                        onOpenclawVersionActionComplete=${r.handleOpenclawVersionActionComplete}
                        onOpenclawUpdate=${r.handleOpenclawUpdate}
                      />
                    </${rt}>
                    <${rt} path="/usage/:sessionId">
                      ${C=>Ut`
                        <${Rc}
                          sessionId=${decodeURIComponent(C.sessionId||"")}
                          onSetLocation=${e}
                        />
                      `}
                    </${rt}>
                    <${rt} path="/usage">
                      <${Rc} onSetLocation=${e} />
                    </${rt}>
                    <${rt} path="/webhooks/:hookName">
                      ${C=>Ut`
                        <${Nc}
                          hookName=${decodeURIComponent(C.hookName||"")}
                          routeHistoryRef=${c.routeHistoryRef}
                          getCurrentPath=${Wf}
                          onSetLocation=${e}
                          onRestartRequired=${r.setRestartRequired}
                          onNavigateToBrowseFile=${d.navigateToBrowseFile}
                        />
                      `}
                    </${rt}>
                    <${rt} path="/webhooks">
                      <${Nc}
                        routeHistoryRef=${c.routeHistoryRef}
                        getCurrentPath=${Wf}
                        onSetLocation=${e}
                        onRestartRequired=${r.setRestartRequired}
                        onNavigateToBrowseFile=${d.navigateToBrowseFile}
                      />
                    </${rt}>
                    <${rt}>
                      <${Ki} to="/general" />
                    </${rt}>
                  </${rd}>
          </div>
              </div>
            `}
        <${Na}
          className="fixed top-4 right-4 z-[60] space-y-2 pointer-events-none"
        />
      </div>

      <div class="app-statusbar">
        <div class="statusbar-left">
          ${o.acVersion?Ut`<span style="color: var(--text-muted)"
                >v${o.acVersion}</span
              >`:null}
        </div>
        <div class="statusbar-right">
          <a href="https://docs.openclaw.ai" target="_blank" rel="noreferrer"
            >docs</a
          >
          <a
            href="https://discord.com/invite/clawd"
            target="_blank"
            rel="noreferrer"
            >discord</a
          >
          <a
            href="https://github.com/openclaw/openclaw"
            target="_blank"
            rel="noreferrer"
            >github</a
          >
        </div>
      </div>
    </div>
  `:Ut`
      <div
        class="min-h-screen flex flex-col items-center pt-12 pb-8 px-4"
        style="position: relative; z-index: 1"
      >
        <${Vb}
          onComplete=${r.handleOnboardingComplete}
          acVersion=${o.acVersion}
        />
      </div>
      <${Na} />
    `},Fc=document.getElementById("app");if(Fc){let t="__alphaclawSetupAppBootCount";window[t]=Number(window[t]||0)+1,wo(null,Fc),Fc.replaceChildren(),wo(Ut`
      <${da} hook=${$k}>
        <${FR} />
      </${da}>
    `,Fc)}
/*! Bundled license information:

@kurkle/color/dist/color.esm.js:
  (*!
   * @kurkle/color v0.3.4
   * https://github.com/kurkle/color#readme
   * (c) 2024 Jukka Kurkela
   * Released under the MIT License
   *)

chart.js/dist/chunks/helpers.dataset.js:
chart.js/dist/chart.js:
  (*!
   * Chart.js v4.5.1
   * https://www.chartjs.org
   * (c) 2025 Chart.js Contributors
   * Released under the MIT License
   *)
*/
