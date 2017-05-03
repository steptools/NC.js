export class WorkingstepIcon extends React.Component {
  constructor(props){
    super(props);
  }
  render(){
      return <div className='icon custom letter'>{this.props.id}</div>;
  }
}
WorkingstepIcon.propTypes = {
  id:React.PropTypes.number.isRequired
}

export class WorkingstepItem extends React.Component {
  constructor(props) {
    super(props);
  }
  render(){
    let cName = 'node';
    if (this.props.current === true) {
      cName += ' running-node';
    }
    return (
      <div className='m-node'>
        <div
          id={this.props.workingstep.id}
          className={cName}
          onClick={() => { this.props.clickCb(this.props.workingstep); }}
          onMouseDown={function (e) {
            e.stopPropagation();
            return false;
          }}
          style={{ 'paddingLeft': '5px' }}
        >
          <WorkingstepIcon id={this.props.iconNumber} />
          <span className="textbox">{this.props.workingstep.name}</span>
        </div>
      </div>
    );
  }
}
WorkingstepItem.propTypes = {
  workingstep: React.PropTypes.object.isRequired,
  iconNumber: React.PropTypes.number.isRequired,
  current: React.PropTypes.bool.isRequired,
  clickCb: React.PropTypes.func.isRequired
}
export class SetupItem extends React.Component {
  constructor(props){
    super(props);
  }
  render(){
    return(
      <div className='m-node'>
        <div className='node setup'>
          <span className="setup-textbox">{this.props.name}</span>
        </div>
      </div>
    );
  }
}
SetupItem.propTypes = {
  name: React.PropTypes.string.isRequired
}

export default class WorkingstepList extends React.Component {
  constructor(props) {
    super(props);

    this.setWS = this.setWS.bind(this);
  }

  componentWillUnmount() {
    // icons need to be removed/reset before unmounting
    for (let i in this.props.workingstepCache) {
      delete this.props.workingstepCache[i].icon;
    }
  }

  setWS(node) {
    let url = '/v3/nc/state/ws/' + node['id'];
    request.get(url).end();
  }

  render() {
    let treeHeight;
    if (this.props.isMobile) {
      treeHeight = {'height': '100%'};
    }
    let wslist = _.filter(this.props.workingstepList,(ws)=>{return this.props.workingstepCache[ws].type==='workingstep'||ws<0});
    let items = wslist.map((wsid,i)=>{
      let ws = this.props.workingstepCache[wsid];
      if (wsid < 0) {
        return (
          <SetupItem name={ws.name} />
        );
      } else if (ws.type === 'workingstep') {
        return (
          <WorkingstepItem
            key={i}
            iconNumber={i}
            workingstep={ws}
            current={this.props.ws === ws.id}
            clickCb={this.setWS}
          />
        );
      }
    });
    return (
      <div className='m-tree' style={treeHeight}>
        {items}
      </div>
    );
  }
}

let rp = React.PropTypes;
WorkingstepList.propTypes = {
  cbMode: rp.func.isRequired,
  cbTree: rp.func.isRequired,
  ws: rp.oneOfType([rp.string, rp.number]).isRequired,
};
