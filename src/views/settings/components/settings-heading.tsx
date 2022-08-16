/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';
import { Padding, Row, Text } from '@zextras/carbonio-design-system';

const Heading: FC<{
	title: string;
	size?: 'extrasmall' | 'small' | 'medium' | 'large' | 'extralarge';
}> = ({ title, size = 'large' }) => (
	<>
		<Padding top="medium" />
		<Row
			padding={{ right: 'small' }}
			mainAlignment="baseline"
			crossAlignment="baseline"
			width="100%"
		>
			<Text size={size} weight="bold">
				{title}
			</Text>
		</Row>

		<Padding bottom="medium" />
	</>
);

export default Heading;
