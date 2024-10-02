/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactNode, useMemo } from 'react';

import { ContainerProps } from '@zextras/carbonio-design-system';

import { normalizeDropdownActionItem } from '../../../../helpers/actions';
import { useMsgActions } from '../../../../hooks/actions/use-msg-actions';
import { useTagDropdownItem } from '../../../../hooks/use-tag-dropdown-item';
import { MailMessage } from '../../../../types';
import { HoverBarContainer } from '../parts/hover-bar-container';
import { HoverContainer } from '../parts/hover-container';
import { ListItemDropdownAction } from '../parts/list-item-dropdown-action';
import { ListItemHoverActions } from '../parts/list-item-hover-actions';

type MessageListItemActionWrapperProps = {
	children?: ReactNode;
	onClick?: ContainerProps['onClick'];
	onDoubleClick?: ContainerProps['onDoubleClick'];
	shouldReplaceHistory?: boolean;
	active?: boolean;
	item: MailMessage;
	deselectAll: () => void;
	messagePreviewFactory: () => React.JSX.Element;
};
export const MessageListItemActionWrapper = ({
	item,
	active,
	onClick,
	onDoubleClick,
	deselectAll,
	shouldReplaceHistory,
	children,
	messagePreviewFactory
}: MessageListItemActionWrapperProps): React.JSX.Element => {
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
		sendDraftDescriptor,
		markAsSpamDescriptor,
		markAsNotSpamDescriptor,
		applyTagDescriptor,
		moveToFolderDescriptor,
		restoreFolderDescriptor,
		createAppointmentDescriptor,
		printDescriptor,
		previewOnSeparatedWindowDescriptor,
		redirectDescriptor,
		editDraftDescriptor,
		editAsNewDescriptor,
		showOriginalDescriptor,
		downloadEmlDescriptor
	} = useMsgActions({ message: item, deselectAll, shouldReplaceHistory, messagePreviewFactory });

	const tagItem = useTagDropdownItem(applyTagDescriptor, item.tags);

	const dropdownItems = useMemo(
		() =>
			[
				normalizeDropdownActionItem(replyDescriptor),
				normalizeDropdownActionItem(replyAllDescriptor),
				normalizeDropdownActionItem(forwardDescriptor),
				normalizeDropdownActionItem(sendDraftDescriptor),
				normalizeDropdownActionItem(moveToTrashDescriptor),
				normalizeDropdownActionItem(deletePermanentlyDescriptor),
				normalizeDropdownActionItem(messageReadDescriptor),
				normalizeDropdownActionItem(messageUnreadDescriptor),
				normalizeDropdownActionItem(flagDescriptor),
				normalizeDropdownActionItem(unflagDescriptor),
				normalizeDropdownActionItem(markAsSpamDescriptor),
				normalizeDropdownActionItem(markAsNotSpamDescriptor),
				tagItem,
				normalizeDropdownActionItem(moveToFolderDescriptor),
				normalizeDropdownActionItem(restoreFolderDescriptor),
				normalizeDropdownActionItem(createAppointmentDescriptor),
				normalizeDropdownActionItem(printDescriptor),
				normalizeDropdownActionItem(previewOnSeparatedWindowDescriptor),
				normalizeDropdownActionItem(redirectDescriptor),
				normalizeDropdownActionItem(editDraftDescriptor),
				normalizeDropdownActionItem(editAsNewDescriptor),
				normalizeDropdownActionItem(showOriginalDescriptor),
				normalizeDropdownActionItem(downloadEmlDescriptor)
			].filter((action) => !action.disabled),
		[
			createAppointmentDescriptor,
			deletePermanentlyDescriptor,
			downloadEmlDescriptor,
			editAsNewDescriptor,
			editDraftDescriptor,
			flagDescriptor,
			forwardDescriptor,
			markAsNotSpamDescriptor,
			markAsSpamDescriptor,
			messageReadDescriptor,
			messageUnreadDescriptor,
			moveToFolderDescriptor,
			moveToTrashDescriptor,
			previewOnSeparatedWindowDescriptor,
			printDescriptor,
			redirectDescriptor,
			replyAllDescriptor,
			replyDescriptor,
			restoreFolderDescriptor,
			sendDraftDescriptor,
			showOriginalDescriptor,
			tagItem,
			unflagDescriptor
		]
	);

	const hoverActions = [
		replyDescriptor,
		replyAllDescriptor,
		forwardDescriptor,
		moveToTrashDescriptor,
		deletePermanentlyDescriptor,
		messageReadDescriptor,
		messageUnreadDescriptor,
		flagDescriptor,
		unflagDescriptor
	];

	return (
		<ListItemDropdownAction dropdownActions={dropdownItems}>
			<HoverContainer
				data-testid={`hover-container-${item.id}`}
				orientation="horizontal"
				mainAlignment="flex-start"
				crossAlignment="unset"
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				$hoverBackground={active ? 'highlight' : 'gray6'}
			>
				{children}
				<HoverBarContainer
					orientation="horizontal"
					mainAlignment="flex-end"
					crossAlignment="center"
					background={active ? 'highlight' : 'gray6'}
					data-testid={`primary-actions-bar-${item.id}`}
				>
					<ListItemHoverActions actions={hoverActions} />
				</HoverBarContainer>
			</HoverContainer>
		</ListItemDropdownAction>
	);
};
