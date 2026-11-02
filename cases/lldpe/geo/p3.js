const P3POS={1:[-16.5,-9],2:[-5.5,-9],3:[5.5,-9],4:[16.5,-9],5:[-16.5,9],6:[-5.5,9],7:[5.5,9],8:[16.5,9]};
const P3SC={1:2.5,2:1.75,3:2.0,4:1.85,5:1.95,6:4.0,7:2.9,8:2.2};
function P3EXTRA(R){
 /* feed from the storage tank */
 const f1=P3.units[1],tk=[-33,-15];R.push({id:"tank",lab:"Hexane from 12-T-01",svc:"proc",from:0,to:[1],pts:[[tk[0]+4.2,1.2,tk[1]],[P3POS[1][0]-6,1.2,tk[1]],[P3POS[1][0]-6,1.2,P3POS[1][1]],[P3POS[1][0]-2.6,1.2,P3POS[1][1]]],r:.2});
 /* separator outlet to the control valve */
 const sp=P3POS[6];R.push({id:"sep",lab:"Separator outlet",svc:"proc",from:0,to:[6],pts:[[sp[0]-5.2,.9,sp[1]+1.2],[sp[0]-2.3,.9,sp[1]+1.2],[sp[0]-2.3,.9,sp[1]]],r:.18});
}
