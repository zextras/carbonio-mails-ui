/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// This is a temporary solution to avoid errors from theme import
import { ThemeContext } from '@zextras/carbonio-design-system';
import { min } from 'lodash';
import React, { useCallback, useContext, useEffect, useState } from 'react';

type ThemeContextProps = {
	sizes: {
		icon: {
			large: string;
		};
	};
};

type ArgsProps = {
	iconWidth?: number;
	numberLimit?: number;
};

export const useVisibleActionsCount = (
	containerRef: React.RefObject<HTMLInputElement>,
	args: ArgsProps
): [number, () => void] => {
	const [visibleActionsCount, setVisibleActionsCount] = useState<number>(0);
	const { iconWidth, numberLimit } = args;
	const theme = useContext<ThemeContextProps>(ThemeContext);
	const iconSize = iconWidth ?? parseInt(theme.sizes.icon.large, 10);

	const calculateVisibleActionsCount = useCallback(() => {
		if (containerRef && containerRef.current && containerRef?.current?.clientWidth > 0) {
			const evaluation = Math.floor(containerRef.current.clientWidth / iconSize);
			const valueToSet = numberLimit ? (min([evaluation, numberLimit]) as number) : evaluation;
			setVisibleActionsCount(valueToSet);
		}
	}, [containerRef, iconSize, numberLimit]);

	useEffect(() => {
		window.addEventListener('resize', calculateVisibleActionsCount);
		return (): void => window.removeEventListener('resize', calculateVisibleActionsCount);
	}, [calculateVisibleActionsCount]);

	useEffect(() => {
		window.addEventListener('transitionend', calculateVisibleActionsCount);
		return (): void => window.removeEventListener('transitionend', calculateVisibleActionsCount);
	}, [calculateVisibleActionsCount]);

	return [visibleActionsCount, calculateVisibleActionsCount];
};
