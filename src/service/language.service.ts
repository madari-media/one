export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

let languages: Language[] | null = null;

export async function getLanguages(): Promise<Language[]> {
  if (languages) {
    return languages;
  }

  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/umpirsky/language-list/master/data/en/language.json',
    );
    const data = await response.json();

    languages = Object.entries(data).map(([code, name]) => ({
      code,
      name: name as string,
      nativeName: name as string,
    }));

    return languages;
  } catch (error) {
    console.error('Error fetching languages:', error);

    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
    ];
  }
}

export function getLanguageByCode(code: string): Language | undefined {
  return languages?.find((lang) => lang.code === code);
}
