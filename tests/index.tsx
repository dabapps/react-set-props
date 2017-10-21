import * as React from 'react';
import * as ReactDOM from 'react-dom/server';
import { Provider } from 'react-redux';
import * as renderer from 'react-test-renderer';
import { combineReducers, createStore } from 'redux';
import { propsReducer, SetPropsProps, withSetProps } from '../src/';

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
