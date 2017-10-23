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

interface SetPropsParentProps<Props> {
  setProps(props: Partial<Props>): void;
}

export interface StoreProps {
  setPropsReducer: StringKeyedObject & {
    __secretKey: string;
  };
}

interface InternalSetPropsProps<Props> {
  setProps(id: string, props: Partial<Props>): void;
  clearProps(id: string): void;
}

export interface SetPropsDispatchProps<Props> {
  setProps(props: Partial<Props>): void;
  dispatch(): Dispatch<any>;
}

export type SetPropsInterface<Props> = SetPropsDispatchProps<Props> & Props;

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
  state: StoreProps[typeof STORE_KEY] | undefined = { __secretKey: SET_PROPS_SECRET_KEY },
  action: SetPropsAction
): StoreProps[typeof STORE_KEY] {
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
  ExternalProps extends StringKeyedObject = {}
>(getInitialProps: (props: ExternalProps) => Props) {
  const id = uuid();

  const unconnected = connect(
    (
      state,
      parentProps: Readonly<ExternalProps & SetPropsParentProps<Props>>
    ): Props & ExternalProps => {
      const props = state[STORE_KEY];

      if (!props || props.__secretKey !== SET_PROPS_SECRET_KEY) {
        throw new Error(
          'No props reducer found in store. Note: must be called "props".'
        );
      }

      const storeProps = props[id];

      return {
        ...storeProps,
        // TODO: Remove casts when TS supports destructing extended types
        ...parentProps as any
      };
    }
  );

  return (Component: Component<Props>): Component<ExternalProps> => {
    const Connected = unconnected(Component);

    return connect(
      (state: {}, props: Readonly<ExternalProps>) => {
        return props;
      },
      { setProps: setPropsAction, clearProps: clearPropsAction }
    )(
      class SetPropsWrapper extends React.PureComponent<
        ExternalProps & InternalSetPropsProps<Props>,
        Props
      > {
        public constructor(
          inputProps: ExternalProps & InternalSetPropsProps<Props>
        ) {
          super(inputProps);

          this.boundSetProps = this.boundSetProps.bind(this);
        }

        public componentWillMount() {
          // TODO: Remove casts when TS supports destructing extended types
          const { setProps, clearProps, ...externalProps } = this.props as any;

          this.props.setProps(
            id,
            getInitialProps(externalProps)
          );
        }

        public componentWillUnmount() {
          this.props.clearProps(id);
        }

        public render() {
          // TODO: Remove casts when TS supports destructing extended types
          const { setProps, clearProps, ...remainingProps } = this.props as any;

          return (
            <Connected
              {...remainingProps}
              setProps={this.boundSetProps}
            />
          );
        }

        private boundSetProps(props: Partial<Props>) {
          this.props.setProps(id, props);
        }
      }
    );
  };
}
