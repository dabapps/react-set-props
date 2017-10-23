import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { v4 as uuid } from 'uuid';

export const STORE_KEY = 'setPropsReducer';
const SET_PROPS = 'SET_PROPS';
const CLEAR_PROPS = 'CLEAR_PROPS';
const SET_PROPS_SECRET_KEY = 'SET_PROPS_SECRET_KEY';

type Component<P> = React.ComponentClass<P> | React.StatelessComponent<P>;

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

export interface SetPropsChildInterface<Props> extends DispatchProps {
  setProps(props: Partial<Props>): void;
}

interface SetPropsParentInterface<Props> extends SetPropsChildInterface<Props>, DispatchProps {
  id: string;
}

export interface SetPropsStoreInterface {
  setPropsReducer: {
    __secretKey: string;
    [index: string]: {};
  };
}

interface InternalSetPropsInterface<Props> {
  setProps(id: string, props: Partial<Props>): void;
  clearProps(id: string): void;
}

export type SetPropsInterface<Props> = SetPropsChildInterface<Props> & Props;

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
      id
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
        __secretKey: SET_PROPS_SECRET_KEY
      };
    case CLEAR_PROPS:
      const clearedState = {...state};

      delete clearedState[action.payload.id];

      return {
        ...clearedState,
        __secretKey: SET_PROPS_SECRET_KEY
      };
    default:
      return state;
  }
}

export function withSetProps<
  Props extends StringKeyedObject,
  ExternalProps extends StringKeyedObject = StringKeyedObject
>(getInitialProps: (props: StringKeyedObject) => Props) {

  type UnconnectedReturn = SetPropsChildInterface<Props> & ExternalProps & Props;
  type ParentProps = SetPropsParentInterface<Props> & ExternalProps;

  const unconnected = connect((state: SetPropsStoreInterface, parentProps: ParentProps): UnconnectedReturn => {
    const props = state[STORE_KEY];

    // TODO: Remove casts when TS supports destructing extended types
    const { id, ...remainingProps } = parentProps as any;

    if (!props || props.__secretKey !== SET_PROPS_SECRET_KEY) {
      throw new Error(
        `No props reducer found in store. Note: must be called "${STORE_KEY}".`
      );
    }

    const storeProps = props[id];

    return {
      ...storeProps,
      ...remainingProps
    };
  });

  return (Component: Component<SetPropsInterface<Props> & ExternalProps>) => {
    const Connected = unconnected(Component);

    return connect(
      (state, props: ExternalProps): ExternalProps => props,
      {
        setProps: setPropsAction,
        clearProps: clearPropsAction
      }
    )
    (
      class SetPropsWrapper extends React.PureComponent<InternalSetPropsInterface<Props> & ExternalProps, void> {
        private id: string;

        public constructor(
          inputProps: InternalSetPropsInterface<Props> & ExternalProps
        ) {
          super(inputProps);

          this.id = uuid();
          this.boundSetProps = this.boundSetProps.bind(this);
        }

        public componentWillMount() {
          // TODO: Remove casts when TS supports destructing extended types
          const { setProps, clearProps, ...externalProps } = this.props as any;

          this.props.setProps(
            this.id,
            getInitialProps(externalProps)
          );
        }

        public componentWillUnmount() {
          this.props.clearProps(this.id);
        }

        public render() {
          // TODO: Remove casts when TS supports destructing extended types
          const { setProps, clearProps, ...remainingProps } = this.props as any;

          return (
            <Connected
              {...remainingProps}
              id={this.id}
              setProps={this.boundSetProps}
            />
          );
        }

        private boundSetProps(props: Partial<Props>) {
          this.props.setProps(this.id, props);
        }
      }
    );
  };
}
