/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { CreateSnackbarFn, CreateSnackbarFnArgs } from '@zextras/carbonio-design-system';
import { Tag, useSortedTagsArray } from '@zextras/carbonio-ui-commons';
import { TFunction } from 'i18next';
import { includes, map } from 'lodash';
import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors, TIMEOUTS } from 'constants/index';
import { isSpam } from 'helpers/folders';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { convActionEmailStoreAction } from 'store/emails/actions/conv-action-action';
import { UIActionAggregator, UIActionDescriptor } from 'types/actions';
import { ConvActionParameters } from 'types/conversations';
import { ConvActionResponse } from 'types/soap/conv-action';

const createSnackbarMessage = (
	createSnackbar: CreateSnackbarFn,
	label: string,
	severity: CreateSnackbarFnArgs['severity']
): void => {
	createSnackbar({
		key: `tag`,
		replace: true,
		hideButton: true,
		severity,
		label,
		autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT
	});
};
const getSnackbarLabel = (isTagIncluded: boolean, tag: Tag, t: TFunction): string =>
	isTagIncluded
		? t('snackbar.tag_removed', {
				tag: tag.name,
				defaultValue: '"{{tag}}" tag removed'
			})
		: t('snackbar.tag_applied', {
				tag: tag.name,
				defaultValue: '"{{tag}}" tag applied'
			});
const executeTagAction = ({
	canExecute,
	action,
	operation,
	ids,
	tag,
	createSnackbar,
	snackbarSuccessLabel,
	t
}: {
	canExecute: () => boolean;
	action: (params: ConvActionParameters) => Promise<ConvActionResponse>;
	operation: ConvActionParameters['operation'];
	ids: Array<string>;
	tag: Tag;
	createSnackbar: CreateSnackbarFn;
	snackbarSuccessLabel: string;
	t: TFunction;
}): void => {
	if (canExecute()) {
		action({
			operation,
			ids,
			tagName: tag.name
		}).then((res: ConvActionResponse) => {
			if (!('Fault' in res)) {
				createSnackbarMessage(createSnackbar, snackbarSuccessLabel, 'info');
			} else {
				createSnackbarMessage(
					createSnackbar,
					t('label.error_try_again', 'Something went wrong, please try again'),
					'error'
				);
			}
		});
	}
};
export const useConvApplyTagSubDescriptors = ({
	ids,
	conversationTags,
	folderId
}: {
	ids: Array<string>;
	conversationTags: Array<string>;
	folderId: string;
}): UIActionDescriptor[] => {
	const { createSnackbar } = useUiUtilities();
	const [t] = useTranslation();
	const tags = useSortedTagsArray();

	const tagActions = useMemo(
		() =>
			map(tags, (tag) => {
				const isTagIncluded = includes(conversationTags, tag.id);
				const operation = isTagIncluded ? '!tag' : 'tag';
				const icon = isTagIncluded ? 'TagOutline' : 'Tag';
				const snackbarSuccessLabel = getSnackbarLabel(isTagIncluded, tag, t);

				const canExecute = (): boolean => !isSpam(folderId);

				const execute = (): void => {
					executeTagAction({
						canExecute,
						action: convActionEmailStoreAction,
						operation,
						ids,
						tag,
						createSnackbar,
						snackbarSuccessLabel,
						t
					});
				};

				return {
					id: tag.id,
					icon,
					label: tag.name,
					color: tag.color,
					execute,
					canExecute
				};
			}),
		[tags, conversationTags, t, folderId, ids, createSnackbar]
	);

	return useMemo(() => tagActions, [tagActions]);
};

export const useConvApplyTagDescriptor = ({
	ids,
	conversationTags,
	folderId
}: {
	ids: Array<string>;
	conversationTags: Array<string>;
	folderId: string;
}): UIActionAggregator => {
	const [t] = useTranslation();
	const items = useConvApplyTagSubDescriptors({ ids, conversationTags, folderId });
	return {
		id: ConversationActionsDescriptors.APPLY_TAG.id,
		label: t('label.tag', 'Tag'),
		icon: 'TagsMoreOutline',
		items
	};
};
