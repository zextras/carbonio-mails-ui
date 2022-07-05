/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useCallback, FC } from 'react';
import { find, isEmpty, reduce, includes } from 'lodash';
import {
	useUserAccounts,
	replaceHistory,
	useTags,
	ZIMBRA_STANDARD_COLORS,
	Tag,
	FOLDERS
} from '@zextras/carbonio-shell-ui';
import { Container, Icon, Padding, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { getTimeLabel, participantToString } from '../../commons/utils';
import { ItemAvatar } from '../app/folder-panel/lists-item/item-avatar';
import { SenderName } from '../app/folder-panel/lists-item/sender-name';
import { useTagExist } from '../../ui-actions/tag-actions';
import { IncompleteMessage, TextReadValuesProps } from '../../types';
import { ListItemActionWrapper } from '../app/folder-panel/lists-item/list-item-actions-wrapper';

type SearchMessageListItemProps = {
	item: IncompleteMessage;
	folderId: string;
	isConvChildren: boolean;
};

export const SearchMessageListItem: FC<SearchMessageListItemProps> = ({
	item,
	folderId,
	isConvChildren
}) => {
	const [t] = useTranslation();
	const accounts = useUserAccounts();
	const tagsFromStore = useTags();
	const tags = useMemo(
		() =>
			reduce(
				tagsFromStore,
				(acc: Array<Tag>, v) => {
					if (includes(item.tags, v.id))
						acc.push({ ...v, color: parseInt(ZIMBRA_STANDARD_COLORS[v.color ?? '0'].hex, 10) });
					return acc;
				},
				[]
			),
		[item.tags, tagsFromStore]
	);

	const [date, participantsString] = useMemo(() => {
		if (item) {
			const sender = find(item.participants, ['type', 'f']);
			return [getTimeLabel(item.date), participantToString(sender, t, accounts)];
		}
		return ['.', '.', '', ''];
	}, [item, t, accounts]);

	const [showIcon, icon, iconTooltip, iconId, color] = useMemo(() => {
		if (item) {
			if (item.isSentByMe && !item.isDraft && !item.isReplied && !item.isForwarded) {
				return [true, 'PaperPlaneOutline', t('label.sent', 'Sent'), 'SentIcon', 'secondary'];
			}
			if (item.isDraft) {
				return [true, 'FileOutline', t('label.draft', 'Draft'), 'DraftIcon', 'secondary'];
			}
			if (item.isReplied) {
				return [true, 'UndoOutline', t('label.replied', 'Replied'), 'RepliedIcon', 'secondary'];
			}
			if (
				item.read === false &&
				!item.isReplied &&
				!item.isDraft &&
				!item.isSentByMe &&
				!item.isForwarded
			) {
				return [true, 'EmailOutline', t('search.unread', 'Unread'), 'UnreadIcon', 'primary'];
			}
			if (
				item.read !== false &&
				!item.isReplied &&
				!item.isDraft &&
				!item.isSentByMe &&
				!item.isForwarded
			) {
				return [true, 'EmailReadOutline', t('label.read', 'Read'), 'ReadIcon', 'secondary'];
			}
			if (item.isForwarded) {
				return [true, 'Forward', t('label.forwarded', 'Forwarded'), 'ForwardedIcon', 'secondary'];
			}
		}
		return [false, '', '', '', ''];
	}, [item, t]);

	const onClick = useCallback(
		(e) => {
			if (!e.isDefaultPrevented()) {
				replaceHistory(`/folder/${item.parent}/message/${item.id}`);
			}
		},
		[item.id, item.parent]
	);

	const fragmentLabel = useMemo(
		() => (isConvChildren ? item.fragment : ` - ${item.fragment}`),
		[item.fragment, isConvChildren]
	);
	const textReadValues: TextReadValuesProps = useMemo(() => {
		if (typeof item.read === 'undefined')
			return { color: 'text', weight: 'regular', badge: 'read' };
		return item.read
			? { color: 'text', weight: 'regular', badge: 'read' }
			: { color: 'primary', weight: 'bold', badge: 'unread' };
	}, [item.read]);

	const isTagInStore = useTagExist(tags);
	const showTagIcon = useMemo(
		() => item.tags && item.tags.length !== 0 && item.tags?.[0] !== '' && isTagInStore,
		[isTagInStore, item.tags]
	);
	const tagIcon = useMemo(() => (tags.length > 1 ? 'TagsMoreOutline' : 'Tag'), [tags]);
	const tagIconColor = useMemo(() => (tags.length === 1 ? tags[0].color : undefined), [tags]);
	const subject = useMemo(
		() => item.subject || t('label.no_subject_with_tags', '<No Subject>'),
		[item.subject, t]
	);
	const subFragmentTooltipLabel = useMemo(
		() => (!isEmpty(item.fragment) ? item.fragment : subject),
		[subject, item.fragment]
	);
	return (
		<Container
			mainAlignment="flex-start"
			data-testid={`SearchMessageListItem-${item.id}`}
			background={item.read ? 'tranparent' : 'gray5'}
		>
			<ListItemActionWrapper item={item} onClick={onClick}>
				<div style={{ alignSelf: 'center' }} data-testid={`AvatarContainer`}>
					<ItemAvatar item={item} folderId={folderId} />
					<Padding horizontal="extrasmall" />
				</div>
				<Row
					wrap="wrap"
					orientation="horizontal"
					takeAvailableSpace
					padding={{ left: 'small', top: 'small', bottom: 'small', right: 'large' }}
				>
					<Container orientation="horizontal" height="fit" width="fill">
						<SenderName item={item} textValues={textReadValues} isFromSearch />
						<Row>
							{showTagIcon && (
								<Padding left="small">
									<Icon data-testid="TagIcon" icon={tagIcon} color={tagIconColor} />
								</Padding>
							)}
							{item.attachment && (
								<Padding left="small">
									<Icon data-testid="AttachmentIcon" icon="AttachOutline" />
								</Padding>
							)}
							{item.flagged && (
								<Padding left="small">
									<Icon data-testid="FlagIcon" color="error" icon="Flag" />
								</Padding>
							)}
							{item.parent === FOLDERS.TRASH && (
								<Padding left="small">
									<Icon data-testid="DeletedIcon" icon="Trash2Outline" />
								</Padding>
							)}
							<Padding left="small">
								<Text data-testid="DateLabel" size="extrasmall">
									{date}
								</Text>
							</Padding>
						</Row>
					</Container>
					<Container orientation="horizontal" height="fit" width="fill" crossAlignment="center">
						<Row
							wrap="nowrap"
							takeAvailableSpace
							mainAlignment="flex-start"
							crossAlignment="center"
						>
							{showIcon && (
								<Tooltip label={iconTooltip} placement="bottom">
									<Padding right="extrasmall">
										<Icon data-testid={iconId} icon={icon} color={color} />
									</Padding>
								</Tooltip>
							)}
							<Tooltip label={subFragmentTooltipLabel} overflow="break-word" maxWidth="60vw">
								<Row
									wrap="nowrap"
									takeAvailableSpace
									mainAlignment="flex-start"
									crossAlignment="baseline"
								>
									{!isConvChildren && (
										<Text
											data-testid="Subject"
											weight={textReadValues.weight}
											color={item.subject ? 'text' : 'secondary'}
										>
											{subject}
										</Text>
									)}

									{!isEmpty(item.fragment) && (
										<Row
											takeAvailableSpace
											mainAlignment="flex-start"
											padding={{ left: 'extrasmall' }}
										>
											<Text
												data-testid="Fragment"
												size="small"
												color="secondary"
												weight={textReadValues.weight}
											>
												{fragmentLabel}
											</Text>
										</Row>
									)}
								</Row>
							</Tooltip>
						</Row>
						<Row>
							{item.urgent && (
								<Padding left="extrasmall">
									<Icon data-testid="UrgentIcon" icon="ArrowUpward" color="error" />
								</Padding>
							)}
						</Row>
					</Container>
				</Row>
			</ListItemActionWrapper>
		</Container>
	);
};
