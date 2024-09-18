/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useMemo } from 'react';

import {
	Dropdown,
	DropdownItem,
	IconButton,
	Padding,
	Row,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useAppContext } from '@zextras/carbonio-shell-ui';
import { isNil, map, noop } from 'lodash';
import { useParams } from 'react-router-dom';

import { normalizeDropdownActionItem } from '../helpers/actions';
import { useMsgActions } from '../hooks/actions/use-msg-actions';
import { useSelection } from '../hooks/use-selection';
import { useTagDropdownItem } from '../hooks/use-tag-dropdown-item';
import { AppContext, MailMessage } from '../types';

type MailMsgPreviewActionsType = {
	message: MailMessage;
};

export const MailMsgPreviewActions: FC<MailMsgPreviewActionsType> = ({ message }): ReactElement => {
	const { setCount } = useAppContext<AppContext>();
	const { deselectAll } = useSelection({ setCount, count: 0 });
	const { itemId } = useParams<{ itemId: string }>();
	const shouldReplaceHistory = useMemo(() => itemId === message.id, [message.id, itemId]);
	const {
		replyDescriptor,
		replyAllDescriptor,
		forwardDescriptor,
		moveToTrashDescriptor,
		deletePermanentlyDescriptor,
		messageReadDescriptor,
		messageUnreadDescriptor,
		flagDescriptor,
		unflagDescriptor,
		markAsSpamDescriptor,
		markAsNotSpamDescriptor,
		applyTagDescriptor,
		moveToFolderDescriptor,
		createAppointmentDescriptor,
		printDescriptor,
		previewOnSeparatedWindowDescriptor,
		redirectDescriptor,
		editAsNewDescriptor,
		showOriginalDescriptor,
		downloadEmlDescriptor
	} = useMsgActions({
		deselectAll,
		message,
		shouldReplaceHistory
	});

	const tagItem = useTagDropdownItem(applyTagDescriptor, message.tags);
	const moreItem: DropdownItem = {
		id: 'More',
		icon: 'MoreVertical',
		label: 'More actions',
		items: [
			normalizeDropdownActionItem(flagDescriptor),
			normalizeDropdownActionItem(unflagDescriptor),
			normalizeDropdownActionItem(markAsSpamDescriptor),
			normalizeDropdownActionItem(markAsNotSpamDescriptor),
			tagItem,
			normalizeDropdownActionItem(moveToFolderDescriptor),
			normalizeDropdownActionItem(createAppointmentDescriptor),
			normalizeDropdownActionItem(printDescriptor),
			normalizeDropdownActionItem(previewOnSeparatedWindowDescriptor),
			normalizeDropdownActionItem(redirectDescriptor),
			normalizeDropdownActionItem(editAsNewDescriptor),
			normalizeDropdownActionItem(showOriginalDescriptor),
			normalizeDropdownActionItem(downloadEmlDescriptor)
		]
	};

	const actions = [
		replyDescriptor,
		replyAllDescriptor,
		forwardDescriptor,
		moveToTrashDescriptor,
		deletePermanentlyDescriptor,
		messageReadDescriptor,
		messageUnreadDescriptor,
		moreItem
	];
	return (
		<Row mainAlignment="flex-end" wrap="nowrap">
			{actions?.length > 0 &&
				map(actions, (action) => {
					if ('items' in action && !isNil(action.items) && action.icon) {
						return (
							<Padding key={action.label} right="small">
								<Tooltip label={action.label}>
									<Dropdown items={action.items}>
										<IconButton icon={action.icon} size="small" onClick={noop} />
									</Dropdown>
								</Tooltip>
							</Padding>
						);
					}
					if ('execute' in action) {
						return (
							<Tooltip key={`${action.icon}`} label={action.label}>
								<IconButton size="small" icon={action.icon} onClick={action.execute} />
							</Tooltip>
						);
					}
					return null;
				})}
		</Row>
	);
};
