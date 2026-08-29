Markdown 格式示例

这是一篇 Markdown 格式的文章，演示图片、数学公式和各种格式的用法。

## 一、文字格式

支持**粗体**、*斜体*、~~删除线~~，以及 `行内代码`。

> 这是一段引用文字。可以用来强调重要内容或引用他人观点。

## 二、列表

无序列表：
- 第一项
- 第二项
- 第三项

有序列表：
1. 步骤一
2. 步骤二
3. 步骤三

## 三、数学公式

行内公式：爱因斯坦质能方程 $E = mc^2$ 很简洁。

独立公式（块级）：

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

矩阵示例：

$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$

## 四、插入图片

图片语法：`![描述文字](图片路径)`

图片放在 public 目录下，例如把图片放到 `public/article-images/` 文件夹，然后这样引用：

![示例图片](/article-images/example.jpg)

## 五、代码块

```javascript
function hello() {
  console.log('Hello, Markdown!')
}
```

## 六、表格

| 功能 | TXT | Markdown |
|------|-----|----------|
| 纯文字 | ✅ | ✅ |
| 图片 | ❌ | ✅ |
| 公式 | ❌ | ✅ |
| 表格 | ❌ | ✅ |

## 七、链接

[访问 Markdown 教程](https://markdown.com.cn/)
