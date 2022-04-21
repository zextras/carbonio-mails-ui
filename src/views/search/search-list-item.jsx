/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { isEmpty, split, head, includes, reduce } from 'lodash';
import {
	Badge,
	Container,
	Icon,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTags, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-shell-ui';
import ListItemActionWrapper from '../app/folder-panel/lists-item/list-item-actions-wrapper';
import { ItemAvatar } from '../app/folder-panel/lists-item/item-avatar';
import { RowInfo } from '../app/folder-panel/lists-item/conversation-list-item';
import { SenderName } from '../app/folder-panel/lists-item/sender-name';

const SearchListItem = ({ item, folderId, selected, selecting, toggle, active }) => {
	const [t] = useTranslation();
	const history = useHistory();
	const dispatch = useDispatch();
	const { pathname } = useLocation();
	const parent = item?.messages[0]?.parent;
	const _onClick = useCallback(() => {
		const path = head(split(pathname, '/folder'));
		dispatch({
			type: 'conversations/setCurrentFolder',
			payload: parent
		});
		history.push(`${path}/folder/${parent}/conversation/${item.id}`);
	}, [dispatch, history, item, parent, pathname]);
	const subject = useMemo(
		() => item.subject || t('label.no_subject', 'No subject'),
		[item.subject, t]
	);
	const subFragmentTooltipLabel = useMemo(
		() => (!isEmpty(item.fragment) ? `${subject} - ${item.fragment}` : subject),
		[subject, item.fragment]
	);

	const tagsFromStore = useTags();
	const tags = useMemo(
		() =>
			reduce(
				tagsFromStore,
				(acc, v) => {
					if (includes(item.tags, v.name))
						acc.push({ ...v, color: ZIMBRA_STANDARD_COLORS[parseInt(v.color ?? '0', 10)].hex });
					return acc;
				},
				[]
			),
		[item.tags, tagsFromStore]
	);

	return (
		<Container
			background={active ? 'highlight' : 'gray6'}
			mainAlignment="flex-start"
			data-testid={`ConversationListItem-${item.id}`}
		>
			<ListItemActionWrapper item={item} current={active} onClick={_onClick} isConversation>
				<div style={{ alignSelf: 'center' }} data-testid={`AvatarContainer`}>
					<ItemAvatar
						item={item}
						selected={selected}
						selecting={selecting}
						toggle={toggle}
						folderId={folderId}
						isSearch
					/>
					<Padding horizontal="extrasmall" />
				</div>
				<Row
					takeAvailableSpace
					orientation="horizontal"
					wrap="wrap"
					padding={{ left: 'small', top: 'small', bottom: 'small', right: 'large' }}
				>
					<Container orientation="horizontal" height="fit" width="fill">
						<SenderName item={item} isFromSearch />
						<RowInfo item={item} tags={tags} />
					</Container>
					<Container orientation="horizontal" height="fit" width="fill" crossAlignment="center">
						{item.msgCount > 1 && (
							<Row>
								<Padding right="extrasmall">
									<Badge value={item.msgCount} type={item.read ? 'read' : 'unread'} />
								</Padding>
							</Row>
						)}
						<Tooltip label={subFragmentTooltipLabel} overflow="break-word" maxWidth="60vw">
							<Row
								wrap="nowrap"
								takeAvailableSpace
								mainAlignment="flex-start"
								crossAlignment="baseline"
							>
								{item.subject ? (
									<Text data-testid="Subject" weight={item.read ? 'regular' : 'bold'} size="small">
										{item.subject}
									</Text>
								) : (
									<Text
										data-testid="NoSubject"
										weight={item.read ? 'regular' : 'bold'}
										size="small"
										color="secondary"
									>
										{t('label.no_subject', 'No subject')}
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
										>{` - ${item.fragment}`}</Text>
									</Row>
								)}
							</Row>
						</Tooltip>
						<Row>
							{item.urgent && <Icon data-testid="UrgentIcon" icon="ArrowUpward" color="error" />}
						</Row>
					</Container>
				</Row>
			</ListItemActionWrapper>
		</Container>
	);
};

export default SearchListItem;
