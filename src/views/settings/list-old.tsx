/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect, useMemo, useRef } from 'react';

import {
	Container,
	ContainerProps,
	getColor,
	getKeyboardPreset,
	KeyboardPresetObj,
	pseudoClasses,
	useIsVisible,
	useKeyboard
} from '@zextras/carbonio-design-system';
import { map, some } from 'lodash';
import styled, { DefaultTheme, SimpleInterpolation } from 'styled-components';

const StyledContainer = styled(Container)`
	overflow-y: auto;
	overflow-y: overlay;

	&::-webkit-scrollbar {
		width: 0.5rem;
	}

	&::-webkit-scrollbar-track {
		background-color: transparent;
	}

	&::-webkit-scrollbar-thumb {
		background-color: ${({ theme }): string => theme.palette.gray3.regular};
		border-radius: 0.25rem;
	}
`;

const StyledDiv = styled.div<{
	$background: keyof DefaultTheme['palette'];
	$selectedBackground: keyof DefaultTheme['palette'];
	$activeBackground: keyof DefaultTheme['palette'];
	$selected: boolean;
	$active: boolean;
}>`
	user-select: none;
	outline: none;
	background: ${({
		theme,
		$background,
		$selectedBackground,
		$activeBackground,
		$active,
		$selected
	}): string =>
		getColor(
			($active && $activeBackground) || ($selected && $selectedBackground) || $background,
			theme
		)};
	${({
		theme,
		$background,
		$selectedBackground,
		$activeBackground,
		$active,
		$selected
	}): SimpleInterpolation =>
		pseudoClasses(
			theme,
			($active && $activeBackground) || ($selected && $selectedBackground) || $background
		)};
`;

interface ItemType {
	id: string;
}

interface ItemComponentProps<T extends ItemType> {
	item: T;
	visible: boolean;
	active: boolean;
	selected: boolean;
	background: keyof DefaultTheme['palette'];
	selectedBackground: keyof DefaultTheme['palette'];
	activeBackground: keyof DefaultTheme['palette'];
}

interface LIWrapperProps<T extends ItemType> {
	listRef: React.RefObject<HTMLDivElement>;
	item: T;
	ItemComponent: React.ComponentType<ItemComponentProps<T>>;
	itemProps: Record<string, unknown>;
	background: keyof DefaultTheme['palette'];
	selectedBackground: keyof DefaultTheme['palette'];
	activeBackground: keyof DefaultTheme['palette'];
	active: boolean;
	selecting: boolean;
	selected: boolean;
	index: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LIWrapper = React.memo<LIWrapperProps<any>>(function LIWrapperFn({
	item,
	listRef,
	ItemComponent,
	itemProps,
	background,
	selectedBackground,
	activeBackground,
	active,
	selected,
	index,
	...rest
}) {
	const [inView, ref] = useIsVisible<HTMLDivElement>(listRef);

	return (
		<StyledDiv
			tabIndex={index}
			ref={ref}
			$active={active}
			$selected={selected}
			$selectedBackground={selectedBackground}
			$activeBackground={activeBackground}
			$background={background}
		>
			<ItemComponent
				visible={inView}
				item={item}
				{...itemProps}
				{...rest}
				active={active}
				selected={selected}
				selectedBackground={selectedBackground}
				activeBackground={activeBackground}
				background={background}
			/>
		</StyledDiv>
	);
});

interface BottomElementProps {
	listRef: React.RefObject<HTMLDivElement>;
	onVisible: () => void;
}

const BottomElement: React.VFC<BottomElementProps> = ({ listRef, onVisible }) => {
	const [inView, ref] = useIsVisible<HTMLDivElement>(listRef);
	useEffect(() => {
		if (inView && onVisible) {
			onVisible();
		}
	}, [inView, onVisible]);
	return <div ref={ref} />;
};

interface ListProps<T extends ItemType> extends ContainerProps {
	/** Array of items to be displayed */
	items: Array<T>;
	/** props to be passed down to each item */
	itemProps?: Record<string, unknown>;
	/** Component to be rendered for each item */
	ItemComponent: React.ComponentType<ItemComponentProps<T>>;
	/** object whose keys are the indexes of the selected items */
	selected?: Record<string, unknown>;
	/** id of the active item */
	active?: string;
	/** callback to be executed when the bottom element is rendered */
	onListBottom?: () => void;
	/** List background color */
	background?: keyof DefaultTheme['palette'];
	/** Selected list item background color */
	selectedBackground?: keyof DefaultTheme['palette'];
	/** Active List item background color */
	activeBackground?: keyof DefaultTheme['palette'];
	/** Disable keyboard shortcuts */
	keyboardShortcutsIsDisabled?: boolean;
}

export const ListOld = React.forwardRef<HTMLDivElement, ListProps<any>>(function ListFn(
	{
		items = [],
		itemProps = {},
		ItemComponent,
		selected = {},

		background = 'transparent',
		selectedBackground = 'gray5',
		activeBackground = 'highlight',

		active,
		onListBottom,
		keyboardShortcutsIsDisabled,
		...rest
	},
	ref
) {
	const selecting = useMemo(() => some(selected, (i) => !!i), [selected]);
	const listRef = useRef<HTMLDivElement | null>(null);
	const useKeyboardShortcuts = (): undefined => undefined;

	const keyEvents = useMemo<KeyboardPresetObj[]>(
		() =>
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			keyboardShortcutsIsDisabled ? [] : getKeyboardPreset('list', useKeyboardShortcuts, listRef),
		[listRef, keyboardShortcutsIsDisabled]
	);
	useKeyboard(listRef, keyEvents);

	return (
		<div ref={listRef} style={{ height: '100%', width: '100%' }}>
			<StyledContainer
				ref={ref}
				orientation="vertical"
				mainAlignment="flex-start"
				crossAlignment="stretch"
				{...rest}
			>
				{map(items, (item, index) => (
					<LIWrapper
						ItemComponent={ItemComponent}
						key={item.id}
						listRef={listRef}
						index={index}
						selectedBackground={selectedBackground}
						itemProps={itemProps}
						item={item}
						activeBackground={activeBackground}
						background={background}
						selected={!!selected[item.id]}
						selecting={selecting}
						active={item.id === active}
					/>
				))}
				{onListBottom && <BottomElement listRef={listRef} onVisible={onListBottom} />}
			</StyledContainer>
		</div>
	);
});
