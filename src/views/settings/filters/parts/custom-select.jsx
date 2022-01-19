/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';
import { Row, Select, Text, Padding, Icon, Container } from '@zextras/carbonio-design-system';
import {
	ColorContainer,
	TextUpperCase
} from '../../../../integrations/shared-invite-reply/parts/styled-components';

const LabelFactory = ({ selected, label, open, focus }) => (
	<ColorContainer
		orientation="horizontal"
		width="fill"
		crossAlignment="center"
		mainAlignment="space-between"
		borderRadius="half"
		background="gray5"
		padding={{
			all: 'extrasmall'
		}}
		minHeight="48px"
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
				<TextUpperCase>{selected[0].label}</TextUpperCase>
			</Row>
		</Row>
		<Icon
			size="large"
			icon={open ? 'ChevronUpOutline' : 'ChevronDownOutline'}
			color={open || focus ? 'primary' : 'secondary'}
			style={{ alignSelf: 'center' }}
		/>
	</ColorContainer>
);

const getItems = (items) =>
	items.map((el) => ({
		label: el?.label,
		value: el?.value,
		customComponent: (
			<Container
				width="100%"
				takeAvailableSpace
				mainAlignment="space-between"
				orientation="horizontal"
				height="fit"
			>
				<Padding left="small">
					<TextUpperCase>{el?.label}</TextUpperCase>
				</Padding>
			</Container>
		)
	}));

const CustomSelect = ({ onChange, defaultSelection, label, items }) => {
	const newItems = useMemo(() => getItems(items), [items]);

	return (
		<Select
			label={label}
			background="gray4"
			onChange={onChange}
			items={newItems}
			defaultSelection={defaultSelection}
			LabelFactory={LabelFactory}
			maxHeight="20vh"
			dropdownWidth="auto"
		/>
	);
};

export default CustomSelect;
