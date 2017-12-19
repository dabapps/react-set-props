import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { v4 as uuid } from 'uuid';

export const STORE_KEY = 'setPropsReducer';
const SET_PROPS = 'SET_PROPS';
const CLEAR_PROPS = 'CLEAR_PROPS';
const SET_PROPS_SECRET_KEY = 'SET_PROPS_SECRET_KEY';

type ComponentType<P> = React.ComponentClass<P> | React.StatelessComponent<P>;

export interface StringKeyedObject {
  [index: string]: any;
}

export interface SetPropsPayload {
  id: string;
  props?: StringKeyedObject;
}

export interface SetPropsAction {
  type: string;
  payload: SetPropsPayload;
}

export interface DispatchProps {
  dispatch(): Dispatch<any>;
}

export interface SetPropsStoreInterface {
  setPropsReducer: {
    __secretKey: string;
    [index: string]: {};
  };
}

interface InternalSetPropsInterface<Props> {
  __setProps(id: string, props: Partial<Props>): void;
  __clearProps(id: string): void;
}

export type SetPropsInterface<Props> = {
  setProps(props: Partial<Props>): void;
} & DispatchProps & Props;

export function setPropsAction<Props>(id: string, props: Partial<Props>) {
  return {
    type: SET_PROPS,
    payload: {
      id,
      props,
    },
  };
}

export function clearPropsAction(id: string) {
  return {
    type: CLEAR_PROPS,
    payload: {
      id,
    },
  };
}

export function setPropsReducer(
  state: SetPropsStoreInterface[typeof STORE_KEY] | undefined = { __secretKey: SET_PROPS_SECRET_KEY },
  action: SetPropsAction
): SetPropsStoreInterface[typeof STORE_KEY] {
  switch (action.type) {
    case SET_PROPS:
      const previous = state[action.payload.id];

      return {
        ...state,
        [action.payload.id]: {
          ...previous,
          ...action.payload.props,
        },
        __secretKey: SET_PROPS_SECRET_KEY,
      };
    case CLEAR_PROPS:
      const clearedState = {...state};

      delete clearedState[action.payload.id];

      return {
        ...clearedState,
        __secretKey: SET_PROPS_SECRET_KEY,
      };
    default:
      return state;
  }
}

export function withSetProps<
  Props extends StringKeyedObject,
  OwnProps extends StringKeyedObject = StringKeyedObject
>(getInitialProps: (props: StringKeyedObject) => Props) {

  const unconnected = (id: string) =>
    connect((state: SetPropsStoreInterface, parentProps: SetPropsInterface<Props>): SetPropsInterface<Props> => {
    const props = state[STORE_KEY];

    if (!props || props.__secretKey !== SET_PROPS_SECRET_KEY) {
      throw new Error(
        `No props reducer found in store. Note: must be called "${STORE_KEY}".`
      );
    }

    const storeProps = props[id];

    return {
      // TODO: Remove casts when TS supports destructing extended types
      ...parentProps as any,
      ...storeProps,
    };
  });

  return (Component: ComponentType<SetPropsInterface<Props> & OwnProps>) => {
    return connect(
      (state, props: OwnProps): OwnProps => props,
      {
        __setProps: setPropsAction,
        __clearProps: clearPropsAction,
      }
    )
    (
      class SetPropsWrapper extends React.PureComponent<InternalSetPropsInterface<Props> & OwnProps, void> {
        private __id: string; // tslint:disable-line:variable-name
        private Connected: ComponentType<SetPropsInterface<Props>>;

        public constructor(
          inputProps: InternalSetPropsInterface<Props> & OwnProps
        ) {
          super(inputProps);

          this.__id = uuid();
          this.Connected = unconnected(this.__id)(Component);
          this.boundSetProps = this.boundSetProps.bind(this);
        }

        public componentWillMount() {
          // TODO: Remove casts when TS supports destructing extended types
          const { __setProps, __clearProps, ...externalProps } = this.props as any;

          this.props.__setProps(
            this.__id,
            getInitialProps(externalProps)
          );
        }

        public componentWillUnmount() {
          this.props.__clearProps(this.__id);
        }

        public render() {
          const { Connected } = this;
          // TODO: Remove casts when TS supports destructing extended types
          const { __setProps, __clearProps, ...remainingProps } = this.props as any;

          return (
            <Connected
              {...remainingProps}
              setProps={this.boundSetProps}
            />
          );
        }

        private boundSetProps(props: Partial<Props>) {
          this.props.__setProps(this.__id, props);
        }
      }
    );
  };
}
