import { type FormEvent, type KeyboardEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { ErrorMessages, errorToMessages } from "../components/ErrorMessages";

/**
 * /editor(新規)と /editor/:slug(編集)。編集時は記事を読み込んでフォームに
 * 事前入力する。読み込み・保存の失敗は .error-messages に出し、画面は残す。
 */
export function Editor() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tagList, setTagList] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    api
      .getArticle(slug)
      .then((article) => {
        if (cancelled) return;
        setTitle(article.title);
        setDescription(article.description);
        setBody(article.body ?? "");
        setTagList(article.tagList);
      })
      .catch((err: unknown) => {
        if (!cancelled) setErrors(errorToMessages(err));
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tagList.includes(tag)) setTagList([...tagList, tag]);
    setTagInput("");
  };

  const onTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors(null);
    try {
      const saved = slug
        ? await api.updateArticle(slug, { title, description, body, tagList })
        : await api.createArticle({ title, description, body, tagList });
      navigate(`/article/${saved.slug}`);
    } catch (err) {
      setErrors(errorToMessages(err));
      setBusy(false);
    }
  };

  return (
    <div className="editor-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-10 offset-md-1 col-xs-12">
            <ErrorMessages messages={errors} />
            <form onSubmit={onSubmit}>
              <fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="text"
                    name="title"
                    placeholder="Article Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    name="description"
                    placeholder="What's this article about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <textarea
                    className="form-control"
                    name="body"
                    rows={8}
                    placeholder="Write your article (in markdown)"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Enter tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={onTagKeyDown}
                    onBlur={addTag}
                  />
                  <div className="tag-list">
                    {tagList.map((tag) => (
                      <span key={tag} className="tag-default tag-pill">
                        <i
                          className="ion-close-round"
                          role="button"
                          tabIndex={0}
                          onClick={() => setTagList(tagList.filter((t) => t !== tag))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setTagList(tagList.filter((t) => t !== tag));
                            }
                          }}
                        />
                        {tag}
                      </span>
                    ))}
                  </div>
                </fieldset>
                <button
                  className="btn btn-lg pull-xs-right btn-primary"
                  type="submit"
                  disabled={busy}
                >
                  Publish Article
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
