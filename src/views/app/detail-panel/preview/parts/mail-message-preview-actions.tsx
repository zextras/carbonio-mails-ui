/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useMemo } from 'react';

import { Button, Dropdown, Padding, Row, Tooltip } from '@zextras/carbonio-design-system';
import { isNil, map, noop } from 'lodash';
import { useTranslation } from 'react-i18next';

import { useShouldReplaceHistory } from '../../../../../hooks/use-should-replace-history';
import { normalizeDropdownActionItem } from 'helpers/actions';
import { useMsgActions } from 'hooks/actions/use-msg-actions';
import { useTagDropdownItem } from 'hooks/use-tag-dropdown-item';
import { MailMessage } from 'types/messages';

type MailMsgPreviewActionsType = {
	message: MailMessage;
	isWide: boolean;
};

export const MailMsgPreviewActions: FC<MailMsgPreviewActionsType> = ({
	message,
	isWide
}): ReactElement => {
	const [t] = useTranslation();
	const shouldReplaceHistory = useShouldReplaceHistory(message);

	const {
		replyDescriptor,
		editDraftDescriptor,
		replyAllDescriptor,
		forwardDescriptor,
		forwardAsAttachmentDescriptor,
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
		downloadEmlDescriptor,
		archiveDescriptor
	} = useMsgActions({
		message,
		shouldReplaceHistory
	});

	const tagItem = useTagDropdownItem(applyTagDescriptor, message.tags);

	const actions = useMemo(() => {
		const moreDropdownItems = [
			normalizeDropdownActionItem(archiveDescriptor),
			normalizeDropdownActionItem(forwardAsAttachmentDescriptor),
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
		].filter((action) => !action.disabled);

		const moreAction = {
			id: 'More',
			icon: 'MoreVertical',
			label: t('tooltip.moreActions', 'More actions'),
			items: moreDropdownItems
		};

		if (isWide) {
			return [
				replyDescriptor,
				replyAllDescriptor,
				forwardDescriptor,
				editDraftDescriptor,
				moveToTrashDescriptor,
				deletePermanentlyDescriptor,
				messageReadDescriptor,
				messageUnreadDescriptor,
				moreAction
			];
		}

		return [
			{
				...moreAction,
				items: [
					normalizeDropdownActionItem(replyDescriptor),
					normalizeDropdownActionItem(replyAllDescriptor),
					normalizeDropdownActionItem(forwardDescriptor),
					normalizeDropdownActionItem(editDraftDescriptor),
					normalizeDropdownActionItem(moveToTrashDescriptor),
					normalizeDropdownActionItem(deletePermanentlyDescriptor),
					normalizeDropdownActionItem(messageReadDescriptor),
					normalizeDropdownActionItem(messageUnreadDescriptor),
					...moreDropdownItems
				]
			}
		];
	}, [
		isWide,
		replyDescriptor,
		replyAllDescriptor,
		forwardDescriptor,
		editDraftDescriptor,
		moveToTrashDescriptor,
		deletePermanentlyDescriptor,
		messageReadDescriptor,
		messageUnreadDescriptor,
		archiveDescriptor,
		forwardAsAttachmentDescriptor,
		flagDescriptor,
		unflagDescriptor,
		markAsSpamDescriptor,
		markAsNotSpamDescriptor,
		tagItem,
		moveToFolderDescriptor,
		createAppointmentDescriptor,
		printDescriptor,
		previewOnSeparatedWindowDescriptor,
		redirectDescriptor,
		editAsNewDescriptor,
		showOriginalDescriptor,
		downloadEmlDescriptor,
		t
	]);

	const stopPropagationWrapperForButton =
		<E extends KeyboardEvent | React.MouseEvent<HTMLButtonElement>>(handler: (event: E) => void) =>
		(event: E) => {
			event.stopPropagation();
			handler(event);
		};

	return (
		<Row mainAlignment="flex-end" wrap="nowrap" data-testid="MailMsgPreviewActions">
			{actions?.length > 0 &&
				map(actions, (action) => {
					if ('items' in action && !isNil(action.items) && action.icon) {
						return (
							<Padding key={action.label} right="small">
								<Tooltip label={action.label}>
									<Dropdown items={action.items}>
										<Button
											type="default"
											backgroundColor={'transparent'}
											labelColor={'text'}
											icon={action.icon}
											size="medium"
											onClick={noop}
										/>
									</Dropdown>
								</Tooltip>
							</Padding>
						);
					}
					if ('execute' in action && action.canExecute()) {
						return (
							<Tooltip key={`${action.icon}`} label={action.label}>
								<Button
									type="default"
									backgroundColor={'transparent'}
									labelColor={'text'}
									size="medium"
									icon={action.icon}
									onClick={stopPropagationWrapperForButton(action.execute)}
								/>
							</Tooltip>
						);
					}
					return null;
				})}
		</Row>
	);
};
