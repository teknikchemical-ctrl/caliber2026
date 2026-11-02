/* ===== Equipment drawing geometry: every machine is assembled from simple primitives (rect, circle, ellipse, line, polygon, path) ===== */
const gr=(x,y,w,h,rx,o)=>["r",x,y,w,h,rx||0,o||{}],gc=(x,y,r,o)=>["c",x,y,r,o||{}],ge=(x,y,rx,ry,o)=>["e",x,y,rx,ry,o||{}],gl=(x1,y1,x2,y2,o)=>["l",x1,y1,x2,y2,o||{}],gpa=(d,o)=>["pa",d,o||{}],gpl=(p,o)=>["pl",p,o||{}],gtx=(x,y,t,s,o)=>["tx",x,y,t,s||9,o||{}];
const GF={body:"#e4eaf1",steel:"#d0d9e4",dark:"#4a586c",white:"#ffffff",none:"transparent",seal:"#f3dfa6",hatch:"url(#ht)",mesh:"url(#xh)",water:"#cfe5f7",green:"#a9d6b0",blue:"#cfe0f5",red:"#f0c4c0",gray:"#bcc6d2"};
const HID={d:"4 3",f:"none",w:1.1},CL={cl:1,f:"none"},DK={f:"dark"};
const GAD={};
/*@@CASE:gad@@*/
