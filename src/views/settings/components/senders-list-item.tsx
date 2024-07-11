/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement, useCallback, useState } from 'react';

import { Container, Text, Row, Button } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import styled from 'styled-components';

const ListItem = styled(Row)`
	border-bottom: 0.0625rem solid ${({ theme }): string => theme.palette.gray2.regular};
	display: block;
	border-radius: 0;
	cursor: pointer;
	background-color: ${({ theme }): string => theme.palette.gray6.regular};
	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray6.focus};
	}
`;

export type SendersListItemProps = {
	value: string;
	onRemove: (sender: string) => void;
};

export const SendersListItem: FC<SendersListItemProps> = ({ value, onRemove }): ReactElement => {
	const [hovered, setHovered] = useState(false);

	const onMouseEnter = useCallback(() => setHovered(true), []);
	const onMouseLeave = useCallback(() => setHovered(false), []);

	const onClick = useCallback(() => {
		onRemove(value);
	}, [onRemove, value]);

	return (
		<ListItem
			data-testid="senders-list-item"
			height="fit"
			orientation="horizontal"
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<Row height="2.5rem" padding={{ all: 'small' }}>
				<Container width="80%" crossAlignment="flex-start">
					<Text size="small">{value}</Text>
				</Container>

				<Container width="20%" orientation="horizontal" mainAlignment="flex-end">
					{hovered && (
						<Button
							size="small"
							color="error"
							type="outlined"
							label={t('label.remove', 'Remove')}
							onClick={onClick}
						/>
					)}
				</Container>
			</Row>
		</ListItem>
	);
};
