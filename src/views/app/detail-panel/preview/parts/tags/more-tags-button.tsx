/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { forwardRef, useMemo } from 'react';

import styled from '@emotion/styled';
import { Tooltip } from '@zextras/carbonio-design-system';
import { LIST_TAG_PILLS_COUNTER_MIN_WIDTH } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

/** reading pane: 13px, as its pills (no font size of the theme is 13px); list: 12px, as its pills. */
const SIZES = {
	medium: { height: '1.5rem', fontSize: '0.8125rem', padding: '0 0.25rem' },
	small: { height: '1.25rem', fontSize: '0.75rem', padding: '0 0.125rem' }
} as const;

/**
 * In a list row "+N" sits next to other targets (the expand arrow of a conversation, the hover actions):
 * the 24px of the target are its own width, as the fit of the list's tags counts it, and it stays above
 * the hover actions, which cover the top of the line.
 */
const LIST_TARGET = `
	min-width: ${LIST_TAG_PILLS_COUNTER_MIN_WIDTH / 16}rem;
	z-index: 1;
`;

const Button = styled.button<{ $size: keyof typeof SIZES }>`
	position: relative;
	flex: none;
	height: ${({ $size }): string => SIZES[$size].height};
	padding: ${({ $size }): string => SIZES[$size].padding};
	border: none;
	border-radius: ${({ theme }): string => theme.borderRadius};
	background: transparent;
	/* secondary.active rather than secondary: #828282 is below 4.5:1 on white at 12px. */
	color: ${({ theme }): string => theme.palette.secondary.active};
	font: inherit;
	font-size: ${({ $size }): string => SIZES[$size].fontSize};
	line-height: 1;
	cursor: pointer;

	${({ $size }): string => ($size === 'small' ? LIST_TARGET : '')}

	&:hover {
		text-decoration: underline;
	}

	/* A target of 24×24 at least, however narrow "+N" is, without taking room in the line. */
	&::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: max(100%, 1.5rem);
		height: max(100%, 1.5rem);
		transform: translate(-50%, -50%);
	}
`;

/** Sets every ref, as React does with one: object refs get the element, callbacks are called. */
const setRefs =
	<T,>(...refs: ReadonlyArray<React.Ref<T> | undefined>) =>
	(element: T | null): void => {
		refs.forEach((ref) => {
			if (typeof ref === 'function') {
				ref(element);
			} else if (ref) {
				const objectRef = ref as React.MutableRefObject<T | null>;
				objectRef.current = element;
			}
		});
	};

type TriggerProps = React.ComponentProps<typeof Button> & {
	/** The caller's ref, set when the button mounts: the Tooltip's own ref is set only in an effect. */
	buttonRef: React.Ref<HTMLButtonElement>;
};

/** Takes the Tooltip's ref, which replaces any ref of its child, and the caller's ref together. */
const Trigger = forwardRef<HTMLButtonElement, TriggerProps>(function Trigger(
	{ buttonRef, ...rest },
	tooltipRef
) {
	const ref = useMemo(() => setRefs(tooltipRef, buttonRef), [tooltipRef, buttonRef]);
	return <Button ref={ref} {...rest} />;
});

export type MoreTagsButtonProps = {
	hiddenCount: number;
	/** Whether the hidden tags are open: the tooltip is hidden meanwhile. */
	open: boolean;
	onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
	size?: keyof typeof SIZES;
};

/**
 * "+N": plain grey text, never a chip, that opens the hidden tags with a click or Enter. Named, and
 * with a tooltip on hover and focus, "Show N more tags".
 */
export const MoreTagsButton = forwardRef<HTMLButtonElement, Readonly<MoreTagsButtonProps>>(
	function MoreTagsButton({ hiddenCount, open, onClick, size = 'medium' }, ref) {
		const [t] = useTranslation();
		const label = t('label.show_more_tags', {
			count: hiddenCount,
			defaultValue_one: 'Show {{count}} more tag',
			defaultValue_other: 'Show {{count}} more tags'
		});
		return (
			<Tooltip label={label} disabled={open}>
				<Trigger
					buttonRef={ref}
					type="button"
					data-testid="more-tags-button"
					$size={size}
					aria-label={label}
					aria-expanded={open}
					aria-haspopup="dialog"
					onClick={onClick}
				>
					+{hiddenCount}
				</Trigger>
			</Tooltip>
		);
	}
);
