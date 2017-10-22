import { mount } from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';
import * as renderer from 'react-test-renderer';
import { combineReducers, createStore } from 'redux';
import {
  clearPropsAction,
  propsReducer,
  setPropsAction,
  SetPropsProps,
  withSetProps
} from '../src/';

describe('Set Props', () => {

  interface ExternalProps {
    buttonText: string;
  }

  interface Props {
    count: number;
  }

  const Counter = (props: ExternalProps & SetPropsProps<Props>) => {
    const {buttonText, count, setProps} = props;

    return (
      <p>
        Count: {count}
        <button onClick={() => setProps({count: count + 1})}>
          {buttonText}
        </button>
      </p>
    );
  };

  const getInitialProps = () => ({
    count: 0
  });

  const SetPropsCounter = withSetProps<Props, ExternalProps>(getInitialProps)(Counter);

  describe('withSetProps', () => {

    it('should expose props to the component provided', () => {
      const testStore = createStore(combineReducers({props: propsReducer}));

      const wrapper = mount(
        <Provider store={testStore}>
          <SetPropsCounter buttonText="Increment" />
        </Provider>
      );

      const props = wrapper.find(Counter).props();

      expect(props.buttonText).toEqual('Increment');
      expect(typeof props.dispatch).toEqual('function');
      expect(typeof props.setProps).toEqual('function');
      expect(typeof (props as any).clearProps).toEqual('undefined');
      expect(typeof (props as any).id).toEqual('undefined');
    });

  });

  describe('Connected Component', () => {

    it('should inject props from the store and accept external props', () => {
      const testStore = createStore(combineReducers({props: propsReducer}));

      const tree = renderer.create(
        <Provider store={testStore}>
          <SetPropsCounter buttonText="Increment" />
        </Provider>
      );

      expect(tree).toMatchSnapshot();
    });

    it('should be able to set props in the store', () => {
      const testStore = createStore(combineReducers({props: propsReducer}));

      expect(testStore.getState()).toEqual({
        props: {
          __secretKey: 'SET_PROPS_SECRET_KEY'
        }
      });

      expect(Object.keys((testStore.getState() as any).props).length).toEqual(1);

      const wrapper = mount(
        <Provider store={testStore}>
          <SetPropsCounter buttonText="Increment" />
        </Provider>
      );

      const propKeys = Object.keys((testStore.getState() as any).props);
      const componentId = propKeys.filter((key) => key !== '__secretKey')[0];

      expect(propKeys.length).toEqual(2);

      let props = (testStore.getState() as any).props[componentId];
      expect(props).toEqual({count: 0});

      wrapper.find('button').first().simulate('click');

      props = (testStore.getState() as any).props[componentId];
      expect(props).toEqual({count: 1});
    });

    it('should clear its props on unmount', () => {
      const testStore = createStore(combineReducers({props: propsReducer}));

      expect(testStore.getState()).toEqual({
        props: {
          __secretKey: 'SET_PROPS_SECRET_KEY'
        }
      });

      expect(Object.keys((testStore.getState() as any).props).length).toEqual(1);

      const wrapper = mount(
        <Provider store={testStore}>
          <SetPropsCounter buttonText="Increment" />
        </Provider>
      );

      expect(Object.keys((testStore.getState() as any).props).length).toEqual(2);

      wrapper.unmount();

      expect(testStore.getState()).toEqual({
        props: {
          __secretKey: 'SET_PROPS_SECRET_KEY'
        }
      });

      const props = (testStore.getState() as any).props;

      expect(Object.keys(props).length).toEqual(1);
      expect(props).toEqual({__secretKey: 'SET_PROPS_SECRET_KEY'});
    });

    it('should error if the props reducer is not present', () => {
      const storeWithInvalidPropsReducer = createStore(combineReducers({propsReducer}));

      const invalidReducer = () => mount(
        <Provider store={storeWithInvalidPropsReducer}>
          <SetPropsCounter buttonText="Increment" />
        </Provider>
      );

      expect(invalidReducer).toThrow();
    });

  });

  describe('Props Reducer', () => {

    let state: {[index: string]: any, __secretKey: string};

    it('should have a default state', () => {
      state = propsReducer(undefined, {type: 'Unknown'} as any);

      expect(state).toEqual({
        __secretKey: 'SET_PROPS_SECRET_KEY'
      });
    });

    it('should handle SET_PROPS action', () => {
      state = propsReducer(state, setPropsAction('id', {foo: 'bar'}));

      expect(state).toEqual({
        __secretKey: 'SET_PROPS_SECRET_KEY',
        id: {
          foo: 'bar'
        }
      });

      state = propsReducer(state, setPropsAction('id2', {foo: 'bar'}));

      expect(state).toEqual({
        __secretKey: 'SET_PROPS_SECRET_KEY',
        id: {
          foo: 'bar'
        },
        id2: {
          foo: 'bar'
        }
      });
    });

    it('should SET_PROPS over existing props', () => {
      state = propsReducer(state, setPropsAction('id', {foo: undefined, baz: 'foo'}));

      expect(state).toEqual({
        __secretKey: 'SET_PROPS_SECRET_KEY',
        id: {
          foo: undefined,
          baz: 'foo'
        },
        id2: {
          foo: 'bar'
        }
      });
    });

    it('should handle CLEAR_PROPS action', () => {
      state = propsReducer(state, clearPropsAction('id'));

      expect(state).toEqual({
        __secretKey: 'SET_PROPS_SECRET_KEY',
        id2: {
          foo: 'bar'
        }
      });

      state = propsReducer(state, clearPropsAction('id2'));

      expect(state).toEqual({
        __secretKey: 'SET_PROPS_SECRET_KEY'
      });
    });

  });

});
