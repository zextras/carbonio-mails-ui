/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';

import { Container, ChipInput, ChipItem } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { filter, map } from 'lodash';
import { Controller, useFormContext } from 'react-hook-form';

import type { SizeLargerSizeSmallerRowProps } from '../../../types';

const SizeLargerSizeSmallerRow: FC<SizeLargerSizeSmallerRowProps> = ({
	sizeSmallerInputName,
	sizeLargerInputName,
	query
}): ReactElement => {
	const { control } = useFormContext();
	const [isInvalidSmallSize, setIsInvalidSmallSize] = useState(false);
	const [isInvalidLargeSize, setIsInvalidLargeSize] = useState(false);
	const errorLabel = useMemo(() => t('search.size_error', 'Only numbers are allowed'), []);

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

	const sizeSmallerPlaceholder = useMemo(
		() => t('label.size_smaller', 'Size smaller than (MB)'),
		[]
	);

	const sizeLargerPlaceholder = useMemo(() => t('label.size_larger', 'Size larger than (MB)'), []);
	const sizeSmallerInQuery: ChipItem[] = map(
		filter(query, (v) => /^Smaller:/.test(v.label)),
		(q) => ({ ...q })
	);

	const sizeLargerInQuery: ChipItem[] = map(
		filter(query, (v) => /^Larger:/.test(v.label)),
		(q) => ({ ...q })
	);
	return (
		<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
			<Container padding={{ right: 'extrasmall' }}>
				<Controller
					control={control}
					name={sizeSmallerInputName}
					defaultValue={sizeSmallerInQuery}
					render={({ field: { onChange, value }, fieldState: { error } }) => (
						<ChipInput
							placeholder={sizeSmallerPlaceholder}
							defaultValue={[]}
							background="gray5"
							value={value}
							onAdd={sizeSmallerChipOnAdd}
							hasError={isInvalidSmallSize}
							description={isInvalidSmallSize ? errorLabel : undefined}
							errorBackgroundColor="gray6"
							onChange={onChange}
							maxChips={1}
							confirmChipOnBlur
							data-testid="sizeSmallerInput"
						/>
					)}
				/>
			</Container>
			<Container padding={{ left: 'extrasmall' }}>
				<Controller
					control={control}
					name={sizeLargerInputName}
					defaultValue={sizeLargerInQuery}
					render={({ field: { onChange, value }, fieldState: { error } }) => (
						<ChipInput
							placeholder={sizeLargerPlaceholder}
							defaultValue={[]}
							background="gray5"
							value={value}
							onAdd={sizeLargerChipOnAdd}
							hasError={isInvalidLargeSize}
							description={isInvalidLargeSize ? errorLabel : undefined}
							errorBackgroundColor="gray6"
							onChange={onChange}
							maxChips={1}
							confirmChipOnBlur
							data-testid="sizeLargerInput"
						/>
					)}
				/>
			</Container>
		</Container>
	);
};

export default SizeLargerSizeSmallerRow;
