// SwipeCards.js
'use strict';

import React, { Component } from 'react';
import {StyleSheet, Text, View, Image, TouchableOpacity, Button} from 'react-native';

/* Gratefully copied from https://github.com/brentvatne/react-native-animated-demo-tinder */


import PropTypes from 'prop-types';


import {
 
  
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';

import clamp from 'clamp';

import Defaults from './Defaults.js';


const viewport = Dimensions.get('window')
const SWIPE_THRESHOLD = 120;




const styles = StyleSheet.create({

	headStyle: {
		fontSize: 50
	},

	viewStyle: {
		backgroundColor: '#F8F8F8',
		justifyContent: 'center',
		alignItems: 'center',
		height: 100,
		paddingTop: 15,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2},
		shadowOpacity: 0.2,
		elevation: 2,
		position: 'relative'
	},

	cardText3:{
  	fontSize: 25,
  	justifyContent: 'center',
    alignItems: 'center',
    height: 180,
    textAlign: 'center',
  	
  },

  cardText1:{
  	fontSize: 25,
  	justifyContent: 'center',
    alignItems: 'center',
    height: 150,
    textAlign: 'center',
  	
  },
  cardText2:{
  	fontSize: 25,
  	justifyContent: 'center',
    alignItems: 'center',
    height: 120,
    textAlign: 'center',
  	
  },
  
  buttonStyle: {
  	justifyContent: 'center',
    alignItems: 'center',
    height: 200,

  },

  card: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 300,
    height: 400,
  },
  noMoreCardsText: {
    fontSize: 22,
     textAlign: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  yup: {
    borderColor: 'green',
    borderWidth: 2,
    position: 'absolute',
    padding: 20,
    bottom: 20,
    borderRadius: 5,
    
  },
  yupText: {
    fontSize: 12,
    color: 'green',
  },
  maybe: {
    borderColor: 'blue',
    borderWidth: 2,
    position: 'absolute',
    padding: 20,
    bottom: 20,
    borderRadius: 5,
    right: 20,
  },
  maybeText: {
    fontSize: 13,
    color: 'blue',
  },
  nope: {
    borderColor: 'red',
    borderWidth: 2,
    position: 'absolute',
    bottom: 20,
    padding: 20,
    borderRadius: 5,
    
  },
  nopeText: {
    fontSize: 12,
    color: 'red',
  }
});

//Components could be unloaded and loaded and we will loose the users currentIndex, we can persist it here.
let currentIndex = {};
let guid = 0;

class SwipeCards extends Component {

  static propTypes = {
    cards: PropTypes.array,
    cardKey: PropTypes.string,
    hasMaybeAction: PropTypes.bool,
    loop: PropTypes.bool,
    onLoop: PropTypes.func,
    allowGestureTermination: PropTypes.bool,
    stack: PropTypes.bool,
    stackGuid: PropTypes.string,
    stackDepth: PropTypes.number,
    stackOffsetX: PropTypes.number,
    stackOffsetY: PropTypes.number,
    renderNoMoreCards: PropTypes.func,
    showYup: PropTypes.bool,
    showMaybe: PropTypes.bool,
    showNope: PropTypes.bool,
    handleYup: PropTypes.func,
    handleMaybe: PropTypes.func,
    handleNope: PropTypes.func,
    yupText: PropTypes.string,
    yupView: PropTypes.element,
    maybeText: PropTypes.string,
    maybeView: PropTypes.element,
    nopeText: PropTypes.string,
    noView: PropTypes.element,
    onClickHandler: PropTypes.func,
    renderCard: PropTypes.func,
    cardRemoved: PropTypes.func,
    dragY: PropTypes.bool,
    smoothTransition: PropTypes.bool
  };

  static defaultProps = {
    cards: [],
    cardKey: 'key',
    hasMaybeAction: false,
    loop: false,
    onLoop: () => null,
    allowGestureTermination: true,
    stack: false,
    stackDepth: 5,
    stackOffsetX: 25,
    stackOffsetY: 0,
    showYup: true,
    showMaybe: true,
    showNope: true,
    handleYup: (card) => null,
    handleMaybe: (card) => null,
    handleNope: (card) => null,
    nopeText: "I don`t remember, let me revisit this in 1 day",
    maybeText: "Vague!",
    yupText: "I remember it well, let me revisit this in 7 days",
    onClickHandler: () => { alert('tap') },
    onDragStart: () => {},
    onDragRelease: () => {},
    cardRemoved: (ix) => null,
    renderCard: (card) => null,
    style: styles.container,
    dragY: true,
    smoothTransition: false
  };

  constructor(props) {
    super(props);

    //Use a persistent variable to track currentIndex instead of a local one.
    this.guid = this.props.guid || guid++;
    if (!currentIndex[this.guid]) currentIndex[this.guid] = 0;

    this.state = {
      pan: new Animated.ValueXY(0),
      enter: new Animated.Value(0.5),
      cards: [].concat(this.props.cards),
      card: this.props.cards[currentIndex[this.guid]],
      
    };

    this.lastX = 0;
    this.lastY = 0;

    this.cardAnimation = null;

    this._panResponder = PanResponder.create({
      onMoveShouldSetPanResponderCapture: (e, gestureState) => {
        if (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3) {
          this.props.onDragStart();
          return true;
        }
        return false;
      },

      onPanResponderGrant: (e, gestureState) => {
        this.state.pan.setOffset({ x: this.state.pan.x._value, y: this.state.pan.y._value });
        this.state.pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderTerminationRequest: (evt, gestureState) => this.props.allowGestureTermination,

      onPanResponderMove: Animated.event([
        null, { dx: this.state.pan.x, dy: this.props.dragY ? this.state.pan.y : 0 },
      ]),

      onPanResponderRelease: (e, {vx, vy, dx, dy}) => {
        this.props.onDragRelease()
        this.state.pan.flattenOffset();
        let velocity;
        if (Math.abs(dx) <= 5 && Math.abs(dy) <= 5)   //meaning the gesture did not cover any distance
        {
          this.props.onClickHandler(this.state.card)
        }

        if (vx > 0) {
         	 velocity = clamp(vx, 3, 5);
        } else if (vx < 0) {
          velocity = clamp(vx * -1, 3, 5) * -1;
        } else {
          velocity = dx < 0 ? -3 : 3;
        }

        const hasSwipedHorizontally = Math.abs(this.state.pan.x._value) > SWIPE_THRESHOLD
        const hasSwipedVertically = Math.abs(this.state.pan.y._value) > SWIPE_THRESHOLD
        if (hasSwipedHorizontally || (hasSwipedVertically && this.props.hasMaybeAction)) {

          let cancelled = false;

          const hasMovedRight = hasSwipedHorizontally && this.state.pan.x._value > 0
          const hasMovedLeft = hasSwipedHorizontally && this.state.pan.x._value < 0
          const hasMovedUp = hasSwipedVertically && this.state.pan.y._value < 0

          if (hasMovedRight) {
            cancelled = this.props.handleYup(this.state.card);
          } else if (hasMovedLeft) {
            cancelled = this.props.handleNope(this.state.card);
          } else if (hasMovedUp && this.props.hasMaybeAction) {
            cancelled = this.props.handleMaybe(this.state.card);
          } else {
            cancelled = true
          }

          //Yup or nope was cancelled, return the card to normal.
          if (cancelled) {
            this._resetPan();
            return;
          };

          this.props.cardRemoved(currentIndex[this.guid]);

          if (this.props.smoothTransition) {
            this._advanceState();
          } else {
            this.cardAnimation = Animated.decay(this.state.pan, {
              velocity: { x: velocity, y: vy },
              deceleration: 0.98
            });
            this.cardAnimation.start(status => {
              if (status.finished) this._advanceState();
              else this._resetState();

              this.cardAnimation = null;
            }
            );
          }

        } else {
          this._resetPan();
        }
      }
    });
  }

  _forceLeftSwipe() {
    this.cardAnimation = Animated.timing(this.state.pan, {
      toValue: { x: -500, y: 0 },
    }).start(status => {
      if (status.finished){ this._advanceState();} 
      else this._resetState();

      this.cardAnimation = null;
    }
      );
    this.props.cardRemoved(currentIndex[this.guid]);
  }

  _forceUpSwipe() {
    this.cardAnimation = Animated.timing(this.state.pan, {
      toValue: { x: 0, y: 500 },
    }).start(status => {
      if (status.finished) this._advanceState();
      else this._resetState();

      this.cardAnimation = null;
    }
      );
    this.props.cardRemoved(currentIndex[this.guid]);
  }

  _forceRightSwipe() {
    this.cardAnimation = Animated.timing(this.state.pan, {
      toValue: { x: 500, y: 0 },
    }).start(status => {
      if (status.finished) this._advanceState();
      else this._resetState();

      this.cardAnimation = null;
    }
      );
    this.props.cardRemoved(currentIndex[this.guid]);
  }

  _goToNextCard() {

    currentIndex[this.guid]++;

    // Checks to see if last card.
    // If props.loop=true, will start again from the first card.
    if (currentIndex[this.guid] > this.state.cards.length - 1 && this.props.loop) {
      this.props.onLoop();
      currentIndex[this.guid] = 0;
    }

    this.setState({

      card: this.state.cards[currentIndex[this.guid]]

    });
    
  }

  _goToPrevCard() {
    this.state.pan.setValue({ x: 0, y: 0 });
    this.state.enter.setValue(0);
    this._animateEntrance();

    currentIndex[this.guid]--;

    if (currentIndex[this.guid] < 0) {
      currentIndex[this.guid] = 0;
    }

    this.setState({
      card: this.state.cards[currentIndex[this.guid]]
    });
  }

  componentDidMount() {
    this._animateEntrance();
  }

  _animateEntrance() {
    Animated.spring(
      this.state.enter,
      { toValue: 1, friction: 8 }
    ).start();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.cards !== this.props.cards) {

      if (this.cardAnimation) {
        this.cardAnimation.stop();
        this.cardAnimation = null;
      }

      currentIndex[this.guid] = 0;
      this.setState({
        cards: [].concat(nextProps.cards),
        card: nextProps.cards[0]


      });
    }
  }

  _resetPan() {
    Animated.spring(this.state.pan, {
      toValue: { x: 0, y: 0 },
      friction: 4
    }).start();
  }

  _resetState() {
    this.state.pan.setValue({ x: 0, y: 0 });
    this.state.enter.setValue(0);
    this._animateEntrance();
  }

  _advanceState() {

    this.state.pan.setValue({ x: 0, y: 0 });
    this.state.enter.setValue(0);
    this._animateEntrance();

    this._goToNextCard();
    
  }

  /**
   * Returns current card object
   */
  getCurrentCard() {
      return this.state.cards[currentIndex[this.guid]];
  }

  renderNoMoreCards() {
    if (this.props.renderNoMoreCards) {
      return this.props.renderNoMoreCards();
    }

    return <Defaults.NoMoreCards />;
  }


  renderCard() {
    if (!this.state.card) {
      return this.renderNoMoreCards();
    }



    let {pan, enter} = this.state;
    let [translateX, translateY] = [pan.x, pan.y];

    let rotate = pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ["-30deg", "0deg", "30deg"] });
    let opacity = pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: [0.5, 1, 0.5] });

    let scale = enter;

    let animatedCardStyles = { transform: [{ translateX }, { translateY }, { rotate }, { scale }], opacity };	

    

    return <Animated.View key={"top"} style={[styles.card, animatedCardStyles]} {... this._panResponder.panHandlers}>
      {this.props.renderCard(this.state.card)}
    </Animated.View>;
  }



  renderNope() {
    let {pan} = this.state;


    let nopeOpacity = pan.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, -(SWIPE_THRESHOLD/2)], outputRange: [1, 0], extrapolate: 'clamp' });
    let nopeScale = pan.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });
    let animatedNopeStyles = { transform: [{ scale: nopeScale }], opacity: nopeOpacity };

    if (this.props.renderNope) {
      return this.props.renderNope(pan);
    }

    if (this.props.showNope) {

      const inner = this.props.noView
        ? this.props.noView
        : <Text style={[styles.nopeText, this.props.nopeTextStyle]}>{this.props.nopeText}</Text>

      return <Animated.View style={[styles.nope, this.props.nopeStyle, animatedNopeStyles]}>
                {inner}
              </Animated.View>;
    }

    return null;
  }





  renderYup() {
    let {pan} = this.state;

    let yupOpacity = pan.x.interpolate({ inputRange: [(SWIPE_THRESHOLD/2), SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
    let yupScale = pan.x.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0.5, 1], extrapolate: 'clamp' });
    let animatedYupStyles = { transform: [{ scale: yupScale }], opacity: yupOpacity };

    if (this.props.renderYup) {
      return this.props.renderYup(pan);
    }

    if (this.props.showYup) {

      const inner = this.props.yupView
        ? this.props.yupView
        : <Text style={[styles.yupText, this.props.yupTextStyle]}>{this.props.yupText}</Text>;

        return <Animated.View style={[styles.yup, this.props.yupStyle, animatedYupStyles]}>
                {inner}
              </Animated.View>;
    }

    return null;
  }






  render() {

    return (
      <View style={styles.container}>
      	{this.props.stack ? this.renderStack() : this.renderCard() }
        {this.renderNope()}
        
        {this.renderYup()}
      </View>
    );
  }
}





























































class Card extends React.Component {

	static state = {ButtonState: '__________', status: 0}
  constructor(props) {
    super(props);
    this.state = {ButtonState: '__________',
					status: true}
}



shouldComponentUpdate(nextProps, nextStates){

	if( this.state.ButtonState.localeCompare('__________') !=0 && nextStates.ButtonState.localeCompare('__________') != 0 ){
		return true;
	}	

	if( this.state.ButtonState.localeCompare('__________') !=0 && nextStates.ButtonState.localeCompare('__________') == 0 ){
		return false;
	}
	if( this.state.ButtonState.localeCompare('__________') ==0 && nextStates.ButtonState.localeCompare('__________') != 0 ){
		return true;
	}
	if( (this.state.ButtonState.localeCompare('__________') == 0) && (nextStates.ButtonState.localeCompare('__________') == 0) ){
		return true;
	}

	
}

componentDidUpdate(prevProps, prevState){
	if( prevState.ButtonState.localeCompare('__________') == 0 && this.state.ButtonState.localeCompare('__________') != 0 ){
		this.setState({ButtonState: '__________'});
	}
}

  render() {

  	
  	
  	
	

    return (

       <View style={[styles.card, {backgroundColor: this.props.backgroundColor}]}>

       

	   <Text style={[styles.cardText1]}>{this.props.text}</Text>
       <Text style={[styles.cardText2]}>{this.state.ButtonState}</Text>



       <Button style={[styles.buttonStyle]} onPress={  () => this.setState({ ButtonState: this.props.myText, status: true }) } title='Show Answer'> </Button>
       <Text></Text>
       <Text></Text>
       <Text></Text>
       <Text></Text>

       	
      </View>
    )
  }
}










































class NoMoreCards extends Component {
  constructor(props) {
    super(props);
  }

  render() {

    return (
      <View>
        <Text style={styles.noMoreCardsText}>You have revised for today come back tomorrow!</Text>
      </View>
    )
  }
}







































export default class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cards: [
        {probno: '1', text: 'Where did the Third Estate form and announce the National Assembly?', backgroundColor: 'orange', myText: 'Indoor Tennis Court'},
        {probno: '2',text: 'Factor for the rise of Napolean', backgroundColor: 'orange', myText: 'Political instability of the Directory'},
        {probno: '3',text: 'Members of the Jacbbin Club were known as', backgroundColor: 'orange', myText: 'San-culottes'},
        {probno: '4',text: 'National Anthem of France', backgroundColor: 'orange', myText: 'Morseillaise'},
        {probno: '5',text: 'Bundle of rods or fasces symbolised', backgroundColor: 'orange', myText: 'Strength lies in unity'},
        {probno: '6',text: 'the main objective of the Constitution of 1791', backgroundColor: 'orange', myText: 'establish a constitutional monarchy'},
        {probno: '7',text: 'Members of the Third Estate were led by', backgroundColor: 'orange', myText: 'Mirabeau and Abbe Sieyes'},
        {probno: '8',text: 'Voting in the Estates General was conducted on the principle of', backgroundColor: 'orange', myText: 'each Estate one vote'},
        {probno: '9',text: 'Who advocated government based on Social Contract?', backgroundColor: 'orange', myText: 'Rousseau'},
        {probno: '10',text: 'King in France at the time of the Revolution', backgroundColor: 'orange', myText: 'Louis XVI'},
        

      ]
    };
  }

  handleYup (card) {
    console.log(`Yup for ${card.text}`)
  }
  handleNope (card) {
    console.log(`Nope for ${card.text}`)
  }
  handleMaybe (card) {
    console.log(`Maybe for ${card.text}`)
  }
  render() {
    // If you want a stack of cards instead of one-per-one view, activate stack mode
    // stack={true}
    return (
    	<View>
    	<View style={styles.viewStyle}><Text style={styles.headStyle}>Purah</Text></View>
      <SwipeCards
        cards={this.state.cards}
        renderCard={(cardData) => <Card {...cardData} />}
        renderNoMoreCards={() => <NoMoreCards />}

        handleYup={this.handleYup}
        handleNope={this.handleNope}
        handleMaybe={this.handleMaybe}
        hasMaybeAction
      />
      </View>
    )
  }
}

