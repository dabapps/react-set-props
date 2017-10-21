import * as React from 'react';
import * as ReactDOM from 'react-dom/server';
import { Provider } from 'react-redux';
import * as renderer from 'react-test-renderer';
import { combineReducers, createStore } from 'redux';
import { clearPropsAction, propsReducer, setPropsAction, SetPropsProps, withSetProps } from '../src/';

describe('Set Props', () => {

  const store = createStore(combineReducers({props: propsReducer}));
  const storeWithInvalidPropsReducer = createStore(combineReducers({propsReducer}));

  interface ExternalProps {
    buttonText: string;
  }

  interface Props {
    count: number;
  }

  const Counter = ({buttonText, count, setProps}: ExternalProps & SetPropsProps<Props>) => (
    <p>
      Count: {count}
      <button onClick={() => setProps({count: count += 1})}>
        {buttonText}
      </button>
    </p>
  );

  const getInitialProps = () => ({
    count: 0
  });

  const SetPropsCounter = withSetProps<Props, ExternalProps>(getInitialProps)(Counter);

  describe('Connected Component', () => {

    it('should inject props from the store and accept external props', () => {
      const tree = renderer.create(
        <Provider store={store}>
          <SetPropsCounter buttonText="Increment" />
        </Provider>
      );

      expect(tree).toMatchSnapshot();
    });

    it('should error if the props reducer is not present', () => {
      const invalidReducer = () => ReactDOM.renderToStaticMarkup(
        <Provider store={storeWithInvalidPropsReducer}>
          <SetPropsCounter buttonText="Increment" />
        </Provider>
      );

      expect(invalidReducer).toThrow();
    });

  });

  describe('Props Reducer', () => {

    let state: {[index: string]: any, secretKey: 'SET_PROPS_SECRET_KEY'};

    it('should have a default state', () => {
      state = propsReducer(undefined, {type: 'Unknown'});

      expect(state).toEqual({
        secretKey: 'SET_PROPS_SECRET_KEY'
      });
    });

    it('should handle SET_PROPS action', () => {
      state = propsReducer(state, setPropsAction('id', {foo: 'bar'}));

      expect(state).toEqual({
        secretKey: 'SET_PROPS_SECRET_KEY',
        id: {
          foo: 'bar'
        }
      });

      state = propsReducer(state, setPropsAction('id2', {foo: 'bar'}));

      expect(state).toEqual({
        secretKey: 'SET_PROPS_SECRET_KEY',
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
        secretKey: 'SET_PROPS_SECRET_KEY',
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
        secretKey: 'SET_PROPS_SECRET_KEY',
        id2: {
          foo: 'bar'
        }
      });

      state = propsReducer(state, clearPropsAction('id2'));

      expect(state).toEqual({
        secretKey: 'SET_PROPS_SECRET_KEY'
      });
    });

  });

});
