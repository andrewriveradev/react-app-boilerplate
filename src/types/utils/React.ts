import type {
    ComponentType,
    ReactNode,
} from 'react';
import type {
    InferProps as PropTypesInferProps,
} from 'prop-types';

import type {
    OmitValues,
} from '@/types';


export type ComponentInstance = ReactNode | Element | any;
export type ComponentDeclaration<Props = Record<string, unknown>> = ComponentType<Props> | ((...args: unknown[]) => ComponentInstance);
export type ReactComponent<Props = Record<string, unknown>> = ComponentInstance | ComponentDeclaration<Props>;


/**
 * Extracts types of JSX component props defined using PropTypes.
 *
 * `PropTypes.InferProps` has a bug where they inject `null` as a possible type for
 * JSX `propTypes` (e.g. `type | null | undefined`) but non-required types can only
 * be `type | undefined`.
 *
 * This fixes the bug by stripping out the `null` values from the resulting
 * `PropTypes.InferProps` call.
 * Note: It must be done for each key-value pair separately so the pairing is maintained.
 *
 * @see [PropTypes.InferProps bug]{@link https://github.com/DefinitelyTyped/DefinitelyTyped/issues/45094}
 */
export type InferProps<O> = OmitValues<PropTypesInferProps<O>, null>;


/**
 * Internal types used by React in `$$typeof` fields.
 * Useful for overriding React typedefs.
 *
 * @type {Object<string, (symbol|number)>}
 * @see [Source code]{@link https://github.com/facebook/react/blob/v17.0.2/packages/shared/ReactSymbols.js}
 */
export const ReactSymbols = {
    REACT_ELEMENT_TYPE: Symbol?.for('react.element') ?? 0xeac7,
    REACT_PORTAL_TYPE: Symbol?.for('react.portal') ?? 0xeaca,
    REACT_FRAGMENT_TYPE: Symbol?.for('react.fragment') ?? 0xeacb,
    REACT_STRICT_MODE_TYPE: Symbol?.for('react.strict_mode') ?? 0xeacc,
    REACT_PROFILER_TYPE: Symbol?.for('react.profiler') ?? 0xead2,
    REACT_PROVIDER_TYPE: Symbol?.for('react.provider') ?? 0xeacd,
    REACT_CONTEXT_TYPE: Symbol?.for('react.context') ?? 0xeace,
    REACT_FORWARD_REF_TYPE: Symbol?.for('react.forward_ref') ?? 0xead0,
    REACT_SUSPENSE_TYPE: Symbol?.for('react.suspense') ?? 0xead1,
    REACT_SUSPENSE_LIST_TYPE: Symbol?.for('react.suspense_list') ?? 0xead8,
    REACT_MEMO_TYPE: Symbol?.for('react.memo') ?? 0xead3,
    REACT_LAZY_TYPE: Symbol?.for('react.lazy') ?? 0xead4,
    REACT_BLOCK_TYPE: Symbol?.for('react.block') ?? 0xead9,
    REACT_SERVER_BLOCK_TYPE: Symbol?.for('react.server.block') ?? 0xeada,
    REACT_FUNDAMENTAL_TYPE: Symbol?.for('react.fundamental') ?? 0xead5,
    REACT_SCOPE_TYPE: Symbol?.for('react.scope') ?? 0xead7,
    REACT_OPAQUE_ID_TYPE: Symbol?.for('react.opaque.id') ?? 0xeae0,
    REACT_DEBUG_TRACING_MODE_TYPE: Symbol?.for('react.debug_trace_mode') ?? 0xeae1,
    REACT_OFFSCREEN_TYPE: Symbol?.for('react.offscreen') ?? 0xeae2,
    REACT_LEGACY_HIDDEN_TYPE: Symbol?.for('react.legacy_hidden') ?? 0xeae3,
};
