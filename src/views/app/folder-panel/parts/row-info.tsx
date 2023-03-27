/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Icon, Padding, Row, Text } from '@zextras/carbonio-design-system';
import { Tag } from '@zextras/carbonio-shell-ui';
import React, { FC, useMemo } from 'react';
import { getTimeLabel } from '../../../../commons/utils';
import { Conversation } from '../../../../types';
import { useTagExist } from '../../../../ui-actions/tag-actions';

type RowInfoProps = {
	item: Conversation;
	tags: Array<Tag>;
	isSearchModule?: boolean;
	allMessagesInTrash?: boolean;
};

export const RowInfo: FC<RowInfoProps> = ({ item, tags, isSearchModule, allMessagesInTrash }) => {
	const date = useMemo(() => getTimeLabel(item.date), [item.date]);

	const tagIcon = useMemo(() => (tags?.length > 1 ? 'TagsMoreOutline' : 'Tag'), [tags]);
	const tagIconColor = useMemo(() => (tags?.length === 1 ? tags?.[0]?.color : undefined), [tags]);

	const isTagInStore = useTagExist(tags);
	const showTagIcon = useMemo(
		() => item.tags && item.tags.length !== 0 && item.tags?.[0] !== '' && isTagInStore,
		[isTagInStore, item.tags]
	);

	return (
		<Row>
			{allMessagesInTrash && isSearchModule && (
				<Padding left="small">
					<Icon data-testid="TrashIcon" icon="Trash2Outline" />
				</Padding>
			)}
			{showTagIcon && (
				<Padding left="small">
					<Icon data-testid="TagIcon" icon={tagIcon} color={`${tagIconColor}`} />
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
