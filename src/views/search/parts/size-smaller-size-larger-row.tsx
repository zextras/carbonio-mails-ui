/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';
import { Container, ChipInput } from '@zextras/carbonio-design-system';
import { SizeLargerSizeSmallerRowProps } from '../../../types';

const SizeLargerSizeSmallerRow: FC<SizeLargerSizeSmallerRowProps> = ({
	compProps
}): ReactElement => {
	const { t, sizeSmaller, setSizeSmaller, sizeLarger, setSizeLarger } = compProps;

	const [isInvalidSmallSize, setIsInvalidSmallSize] = useState(false);
	const [isInvalidLargeSize, setIsInvalidLargeSize] = useState(false);
	const errorLabel = useMemo(() => t('search.size_error', 'Only numbers are allowed'), [t]);

	const onChange = useCallback((state, stateHandler) => {
		stateHandler(state);
	}, []);

	const chipOnAdd = useCallback(
		(label, preText, hasAvatar, isGeneric, isQueryFilter, avatarIcon, error) => ({
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
		(label): any => {
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
		(label): any => {
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
		[t]
	);

	const sizeLargerPlaceholder = useMemo(() => t('label.size_larger', 'Size larger than (MB)'), [t]);

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
					errorLabel={errorLabel}
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
					errorLabel={errorLabel}
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
