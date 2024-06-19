/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { SignItemType } from '../../../types';

export type UseSignatureSettingsResult = {
	validate: (signatures: Array<SignItemType>) => Array<string>;
};

export const getNameLengthErrorMessageKey = (
	signature: SignItemType,
	t: TFunction
): string | null => {
	if (signature.name === undefined || signature.name.trim() === '') {
		return t('label.signature_required', 'Signature information is required.');
	}
	return null;
};

export const getContentLengthErrorMessageKey = (
	signature: SignItemType,
	limit: number | undefined,
	t: TFunction
): string | null => {
	if (!signature.description || signature.description.trim() === '') {
		return t('label.signature_required', 'Signature information is required.');
	}

	if (!limit) {
		return null;
	}

	if (signature.description.trim().length > limit) {
		return t('label.signature_size_exceed', 'One or more signatures exceed the size limit.');
	}
	return null;
};

export const useSignatureSettings = (): UseSignatureSettingsResult => {
	const { attrs } = useUserSettings();
	const [t] = useTranslation();

	const validate = useCallback(
		(signatures: Array<SignItemType>): Array<string> => {
			const errors = new Set<string | null>();
			signatures.forEach((signature) => {
				errors.add(getNameLengthErrorMessageKey(signature, t));
				errors.add(
					getContentLengthErrorMessageKey(signature, Number(attrs.zimbraMailSignatureMaxLength), t)
				);
			});

			return Array.from(errors).reduce<Array<string>>((result, error): Array<string> => {
				if (error !== null) {
					result.push(error);
				}
				return result;
			}, []);
		},
		[attrs.zimbraMailSignatureMaxLength, t]
	);

	return { validate };
};
