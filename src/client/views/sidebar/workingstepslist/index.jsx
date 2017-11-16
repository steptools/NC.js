/* 
 * Copyright (c) 2016-2017 by STEP Tools Inc. 
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */

 class WorkingstepIcon extends React.Component {
   constructor(props){
     super(props);
    }
   render() {
     let styles = {};
     if (this.props.color) {
       styles = {
         borderStyle: 'solid',
         borderWidth: '.25em',
         borderColor: this.props.color
       };
     }
     return (
       <div className='icon custom letter' style={styles}>{this.props.number}</div>
     );
    }
 }
 WorkingstepIcon.propTypes = {
   number:React.PropTypes.number.isRequired,
   color:React.PropTypes.string
 }

 class Workingstep extends React.Component {
   constructor(props){
     super(props);
     this.setWS = this.setWS.bind(this);
   }
  
  setWS(id) {
    let url = '/v3/nc/state/ws/' + id;
    request.get('/v3/nc/state/loop/stop')
      .then((res, err) => {
        if (err);
        return request.get(url);
      }).then((res, err) => {
        if (err);
        return request.get('/v3/nc/geometry/delta/reset');
      });
  }

   render(){
    let wstep = this.props.workingstep;
    let color = "#" + (new THREE.Color(wstep.color)).getHexString();
    let cName = 'node';
    let spanCName = 'textbox';
    if(this.props.isCurWS) {
      cName += ' running-node';
    }
    if (wstep.id ===undefined) {
      cName += ' setup';
      spanCName = 'setup-textbox'
    }
    return (
      <div className='m-node'>
        <div
          id={wstep.id}
          className={cName}
          onClick={() => {
            if (!cName.includes('setup')) {
              this.setWS(wstep.id);
            }
          }}
          onMouseDown={function (e) {
            e.stopPropagation();
            return false;
          }}
          style={{ 'paddingLeft': '5px' }}
          key={wstep.id}
        >
          <WorkingstepIcon number={wstep.number} color={color}/>
          <span className={spanCName}>{wstep.name}</span>
        </div>
      </div>
    )
  }
 }
 Workingstep.propTypes = {
   workingstep: React.PropTypes.object.isRequired,
   isCurWS: React.PropTypes.bool
 }

export default class WorkingstepList extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillUnmount() {
    // icons need to be removed/reset before unmounting
    for (let i in this.props.workingstepCache) {
      delete this.props.workingstepCache[i].icon;
    }
  }

  render() {
    let treeHeight;
    if (this.props.isMobile) {
      treeHeight = {'height': '100%'};
    }
    return (
      <div className='m-tree' style={treeHeight}>
        {this.props.workingstepList.map((workingstep, i) => {
          
          let wstep = this.props.workingstepCache[workingstep];
          let color = "#"+(new THREE.Color(wstep.color)).getHexString();
          let styles = {'backgroundColor':color};
          return (
            <Workingstep
              key={i}
              workingstep={wstep}
              isCurWS={wstep.id === this.props.ws}
            />
          );
        })}
      </div>
    );
  }
}

let rp = React.PropTypes;
WorkingstepList.propTypes = {
  cbMode: rp.func.isRequired,
  cbTree: rp.func.isRequired,
  ws: rp.oneOfType([rp.string, rp.number]).isRequired,
  app: rp.object.isRequired
};
