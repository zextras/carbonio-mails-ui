/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { useTags } from '@zextras/carbonio-shell-ui';
import { includes, map } from 'lodash';
import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors, TIMEOUTS } from '../../constants';
import { isSpam } from '../../helpers/folders';
import { convAction } from '../../store/actions';
import { UIActionAggregator, UIActionDescriptor } from '../../types';
import { useAppDispatch } from '../redux';
import { useUiUtilities } from '../use-ui-utilities';

export const useConvApplyTagDescriptors = ({
	ids,
	conversationTags,
	folderId
}: {
	ids: Array<string>;
	conversationTags: Array<string>;
	folderId: string;
}): UIActionDescriptor[] => {
	const { createSnackbar } = useUiUtilities();
	const dispatch = useAppDispatch();
	const [t] = useTranslation();
	const tags = useTags();

	const tagActions = useMemo(
		() =>
			map(tags, (tag) => {
				const isTagIncluded = includes(conversationTags, tag.id);
				const operation = isTagIncluded ? '!tag' : 'tag';
				const icon = isTagIncluded ? 'TagOutline' : 'Tag';
				const snackbarSuccessLabel = isTagIncluded
					? t('snackbar.tag_removed', {
							tag: tag.name,
							defaultValue: '"{{tag}}" tag removed'
						})
					: t('snackbar.tag_applied', {
							tag: tag.name,
							defaultValue: '"{{tag}}" tag applied'
						});

				const canExecute = (): boolean => !isSpam(folderId);

				const execute = (): void => {
					if (canExecute()) {
						dispatch(
							convAction({
								operation,
								ids,
								tagName: tag.name
							})
						).then((res: any) => {
							if (res.type.includes('fulfilled')) {
								createSnackbar({
									key: `tag`,
									replace: true,
									hideButton: true,
									type: 'info',
									label: snackbarSuccessLabel,
									autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT
								});
							} else {
								createSnackbar({
									key: `tag`,
									replace: true,
									type: 'error',
									label: t('label.error_try_again', 'Something went wrong, please try again'),
									autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT,
									hideButton: true
								});
							}
						});
					}
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
		[createSnackbar, dispatch, folderId, ids, conversationTags, t, tags]
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
	const items = useConvApplyTagDescriptors({ ids, conversationTags, folderId });
	return {
		id: ConversationActionsDescriptors.APPLY_TAG.id,
		label: t('label.tag', 'Tag'),
		icon: 'TagsMoreOutline',
		items
	};
};
