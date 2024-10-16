/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';

import { Container, ChipInput, ChipItem } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import type { SizeLargerSizeSmallerRowProps } from '../../../types';

const SizeLargerSizeSmallerRow: FC<SizeLargerSizeSmallerRowProps> = ({
	compProps
}): ReactElement => {
	const { sizeSmaller, setSizeSmaller, sizeLarger, setSizeLarger } = compProps;

	const [isInvalidSmallSize, setIsInvalidSmallSize] = useState(false);
	const [isInvalidLargeSize, setIsInvalidLargeSize] = useState(false);
	const errorLabel = useMemo(() => t('search.size_error', 'Only numbers are allowed'), []);

	const onChange = useCallback((state: ChipItem[], stateHandler: (state: ChipItem[]) => void) => {
		stateHandler(state);
	}, []);

	const chipOnAdd = useCallback(
		(
			label: string,
			preText: string,
			hasAvatar: boolean,
			isGeneric: boolean,
			isQueryFilter: boolean,
			avatarIcon: string,
			error: boolean
		) => ({
			label: `${preText}:${label}MB`,
			hasAvatar,
			isGeneric,
			isQueryFilter,
			value: `${preText.toLowerCase()}:${label}MB`,
			avatarIcon,
			error
		}),
		[]
	);

	const checkErrorSizeSmaller = useCallback(
		(input: string): void =>
			input.match(/^[0-9]+$/) ? setIsInvalidSmallSize(false) : setIsInvalidSmallSize(true),
		[]
	);

	const checkErrorSizeLarger = useCallback(
		(input: string): void =>
			input.match(/^[0-9]+$/) ? setIsInvalidLargeSize(false) : setIsInvalidLargeSize(true),
		[]
	);
	const sizeSmallerChipOnAdd = useCallback(
		(value: unknown): ChipItem<unknown> => {
			const label = value as string;
			checkErrorSizeSmaller(label);
			return chipOnAdd(
				label,
				'Smaller',
				true,
				true,
				true,
				'CollapseOutline',
				!label.match(/^[0-9]+$/)
			);
		},
		[chipOnAdd, checkErrorSizeSmaller]
	);

	const sizeLargerChipOnAdd = useCallback(
		(value: unknown): ChipItem<unknown> => {
			const label = value as string;
			checkErrorSizeLarger(label);
			return chipOnAdd(
				label,
				'Larger',
				true,
				true,
				true,
				'ExpandOutline',
				!label.match(/^[0-9]+$/)
			);
		},
		[chipOnAdd, checkErrorSizeLarger]
	);

	const sizeSmallerOnChange = useCallback(
		(value: ChipItem[]): void => {
			onChange(value, setSizeSmaller);
			if (value.length === 0) setIsInvalidSmallSize(false);
		},
		[onChange, setSizeSmaller, setIsInvalidSmallSize]
	);

	const sizeLargerOnChange = useCallback(
		(value: ChipItem[]): void => {
			onChange(value, setSizeLarger);
			if (value.length === 0) setIsInvalidLargeSize(false);
		},
		[onChange, setSizeLarger, setIsInvalidLargeSize]
	);

	const sizeSmallerPlaceholder = useMemo(
		() => t('label.size_smaller', 'Size smaller than (MB)'),
		[]
	);

	const sizeLargerPlaceholder = useMemo(() => t('label.size_larger', 'Size larger than (MB)'), []);

	return (
		<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
			<Container padding={{ right: 'extrasmall' }}>
				<ChipInput
					placeholder={sizeSmallerPlaceholder}
					defaultValue={[]}
					background="gray5"
					value={sizeSmaller}
					onAdd={sizeSmallerChipOnAdd}
					hasError={isInvalidSmallSize}
					description={isInvalidSmallSize ? errorLabel : undefined}
					errorBackgroundColor="gray6"
					onChange={sizeSmallerOnChange}
					maxChips={1}
					confirmChipOnBlur
				/>
			</Container>
			<Container padding={{ left: 'extrasmall' }}>
				<ChipInput
					placeholder={sizeLargerPlaceholder}
					defaultValue={[]}
					background="gray5"
					value={sizeLarger}
					onAdd={sizeLargerChipOnAdd}
					hasError={isInvalidLargeSize}
					description={isInvalidLargeSize ? errorLabel : undefined}
					errorBackgroundColor="gray6"
					onChange={sizeLargerOnChange}
					maxChips={1}
					confirmChipOnBlur
				/>
			</Container>
		</Container>
	);
};

export default SizeLargerSizeSmallerRow;
