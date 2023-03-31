/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Icon, Padding, Row, Select, Text } from '@zextras/carbonio-design-system';
import { ZIMBRA_STANDARD_COLORS, t } from '@zextras/carbonio-shell-ui';
import React, { useMemo } from 'react';
import { ColorContainer, Square, TextUpperCase } from './styled-components';

const LabelFactory = ({ selected, label, open, focus }) => (
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
				<TextUpperCase>{selected[0].label}</TextUpperCase>
			</Row>
			<Padding right="small">
				<Square color={ZIMBRA_STANDARD_COLORS[Number(selected[0].value)].hex} />
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

export default function ColorSelect({ onChange, defaultColor = 0, label }) {
	const colors = useMemo(
		() =>
			ZIMBRA_STANDARD_COLORS.map((el, index) => ({
				label: t(el.zLabel, 'banane'),
				value: index.toString(),
				customComponent: (
					<Container
						width="100%"
						mainAlignment="space-between"
						orientation="horizontal"
						height="fit"
					>
						<Padding left="small">
							<TextUpperCase>{t(el.zLabel)}</TextUpperCase>
						</Padding>
						<Square color={el.hex} />
					</Container>
				)
			})),
		[]
	);
	const defaultSelection = useMemo(() => colors[defaultColor], [colors, defaultColor]);
	return (
		<Select
			label={label}
			onChange={onChange}
			items={colors}
			defaultSelection={defaultSelection}
			LabelFactory={LabelFactory}
		/>
	);
}
