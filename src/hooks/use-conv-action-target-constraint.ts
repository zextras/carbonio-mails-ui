/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { useParams } from 'react-router-dom';

import { getConvActionTargetConstraint } from 'helpers/folders';
import { ConvActionTargetConstraint } from 'types/soap';
import { useInSearchModule } from 'ui-actions/utils';

/**
 * Returns the folder where the user's sent mail is saved (zimbraPrefSentMailFolder)
 */
export const useSentMailFolder = (): string | undefined =>
	useUserSettings().prefs.zimbraPrefSentMailFolder as string | undefined;

/**
 * Returns the target constraint that limits a conversation action that moves or deletes messages
 * (move, restore, trash, spam, not spam, delete permanently) to the messages in the group of the folder open in the route.
 * In search there is no folder open: the action applies to the whole conversation.
 * In a shared folder the server checks Sent with the owner's preference, here it is the user's one.
 */
export const useConvActionTargetConstraint = (): ConvActionTargetConstraint | undefined => {
	const { folderId } = useParams<{ folderId?: string }>();
	const inSearchModule = useInSearchModule();
	const sentMailFolder = useSentMailFolder();
	return inSearchModule ? undefined : getConvActionTargetConstraint(folderId, sentMailFolder);
};
