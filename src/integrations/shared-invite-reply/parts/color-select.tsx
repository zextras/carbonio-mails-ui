/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import type { SingleSelectionOnChange } from '@zextras/carbonio-design-system';
import { Container, Icon, Padding, Row, Select, Text } from '@zextras/carbonio-design-system';
import { CustomLabelFactoryProps, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import {
	ColorContainer,
	Square,
	TextUpperCase
} from 'integrations/shared-invite-reply/parts/styled-components';

const LabelFactory = ({
	selected,
	label,
	open,
	focus
}: CustomLabelFactoryProps): React.JSX.Element => {
	// FIXME: potential unsafe access to array, how do you know that selectedColor is not undefined and array is not empty?
	const selectedColor = selected[0];
	return (
		<ColorContainer
			orientation="horizontal"
			width="fill"
			crossAlignment="center"
			mainAlignment="space-between"
			borderRadius="half"
			background="gray5"
			padding={{
				all: 'small'
			}}
		>
			<Row width="100%" takeAvailableSpace mainAlignment="space-between">
				<Row
					orientation="vertical"
					crossAlignment="flex-start"
					mainAlignment="flex-start"
					padding={{ left: 'small' }}
				>
					<Text size="small" color={open || focus ? 'primary' : 'secondary'}>
						{label}
					</Text>
					<TextUpperCase>{selectedColor.label}</TextUpperCase>
				</Row>
				<Padding right="small">
					<Square $color={ZIMBRA_STANDARD_COLORS[parseInt(selectedColor.value, 10)].hex} />
				</Padding>
			</Row>
			<Icon
				size="large"
				icon={open ? 'ChevronUpOutline' : 'ChevronDownOutline'}
				color={open || focus ? 'primary' : 'secondary'}
				style={{ alignSelf: 'center' }}
			/>
		</ColorContainer>
	);
};

export default function ColorSelect({
	onChange,
	defaultColor,
	label
}: Readonly<{
	onChange: SingleSelectionOnChange;
	defaultColor: number;
	label: string;
}>): React.JSX.Element {
	const [t] = useTranslation();
	const colors = useMemo(
		() =>
			ZIMBRA_STANDARD_COLORS.map((el, index) => {
				const colorLabel = t(`colors.${el.zLabel}`, el.zLabel);
				return {
					label: colorLabel,
					value: index.toString(),
					customComponent: (
						<Container
							width="100%"
							mainAlignment="space-between"
							orientation="horizontal"
							height="fit"
						>
							<Padding left="small">
								<TextUpperCase>{colorLabel}</TextUpperCase>
							</Padding>
							<Square $color={el.hex} />
						</Container>
					)
				};
			}),
		[t]
	);
	// FIXME: potential unsafe access to array, how do you know that colors[defaultColor] is not undefined and array is not empty?
	const defaultSelection = useMemo(() => colors[defaultColor], [colors, defaultColor]);
	return (
		<Select
			label={label}
			onChange={onChange}
			items={colors}
			defaultSelection={defaultSelection}
			LabelFactory={LabelFactory}
			data-testid="color-select"
		/>
	);
}
