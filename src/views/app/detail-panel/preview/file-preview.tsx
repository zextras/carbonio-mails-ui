/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useContext, useMemo } from 'react';
import { IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { PreviewsManagerContext } from '@zextras/carbonio-ui-preview';

export const FilePreview: FC<any> = ({ att, link }) => {
	const [t] = useTranslation();
	const { createPreview } = useContext(PreviewsManagerContext);
	const previewType = useMemo(
		() =>
			// eslint-disable-next-line no-nested-ternary
			att.contentType?.startsWith('image')
				? 'image'
				: att.contentType?.endsWith('pdf')
				? 'pdf'
				: undefined,
		[att.contentType]
	);
	const preview = useCallback(() => {
		if (previewType) {
			createPreview({
				src: link,
				previewType
			});
		}
	}, [createPreview, link, previewType]);
	return previewType ? (
		<Tooltip label={t('label.preview', 'Preview')}>
			<IconButton size="medium" icon="SearchOutline" onClick={preview} />
		</Tooltip>
	) : null;
};
