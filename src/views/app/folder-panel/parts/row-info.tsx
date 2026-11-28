/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Icon, Padding, Row, Text } from '@zextras/carbonio-design-system';

import { getTimeLabel } from 'commons/utils';
import { NormalizedConversation } from 'types/conversations';

type RowInfoProps = {
	item: NormalizedConversation;
	isSearchModule?: boolean;
	allMessagesInTrash?: boolean;
};

export const RowInfo: FC<RowInfoProps> = ({ item, isSearchModule, allMessagesInTrash }) => {
	const date = useMemo(() => getTimeLabel(item.date), [item.date]);

	return (
		<Row>
			{allMessagesInTrash && isSearchModule && (
				<Padding left="small">
					<Icon data-testid="TrashIcon" icon="Trash2Outline" />
				</Padding>
			)}
			{item.hasAttachment && (
				<Padding left="small">
					<Icon data-testid="AttachmentIcon" icon="AttachOutline" />
				</Padding>
			)}
			{item.flagged && (
				<Padding left="small">
					<Icon data-testid="FlagIcon" color="error" icon="Flag" />
				</Padding>
			)}
			<Padding left="small" data-testid="DateLabel">
				<Text size="extrasmall">{date}</Text>
			</Padding>
		</Row>
	);
};
